-- 017: registration integrity, payment protection, last-admin safety, audit trail, link checks.
-- Run in the Supabase SQL Editor after 016. Safe to run again.
--
-- What this changes
--   A. Every new registration (online or cash) is checked in the database: birth date,
--      age limits of the category, field lengths, and capacity (serialised, so two people
--      cannot take the last slot at the same time).
--   B. mark_manual_payment_submitted (the function the app uses) and the older
--      mark_gcash_payment_submitted can no longer reopen a verified or refunded payment,
--      or change a payment on a closed registration.
--   C. Payment evidence is locked once a payment is submitted/verified/refunded, and a
--      runner can only attach files from their own folder.
--   D. The last active administrator cannot be removed, deleted or suspended.
--   E. Sensitive changes are written to audit_logs.
--   F. Sponsor website/Facebook links must be http(s) addresses.
begin;

-- ---------------------------------------------------------------------------
-- A. Registration rules
-- ---------------------------------------------------------------------------
create or replace function public.enforce_run_registration_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category public.run_categories;
  v_run_date date;
  v_age integer;
begin
  -- Same lock key as bib allocation and cash registration: these run one at a time per event.
  perform pg_advisory_xact_lock(hashtextextended(new.run_event_id::text, 0));

  if new.birth_date is null then raise exception 'Birth date is required.'; end if;
  if new.birth_date > current_date or new.birth_date < date '1900-01-01' then
    raise exception 'Enter a valid birth date.';
  end if;
  if new.division is null or new.division not in ('male','female') then
    raise exception 'Select a race division.';
  end if;

  if char_length(trim(new.participant_name)) not between 2 and 120 then
    raise exception 'Enter the participant''s full name (2 to 120 characters).';
  end if;
  if char_length(trim(new.mobile)) not between 7 and 25 then
    raise exception 'Enter a valid mobile number.';
  end if;
  if char_length(trim(new.emergency_name)) not between 2 and 120 then
    raise exception 'Enter the emergency contact''s name (2 to 120 characters).';
  end if;
  if char_length(trim(new.emergency_mobile)) not between 7 and 25 then
    raise exception 'Enter a valid emergency contact mobile number.';
  end if;
  if char_length(coalesce(new.locality,'')) > 500
     or char_length(coalesce(new.club_name,'')) > 120
     or char_length(coalesce(new.shirt_size,'')) > 20
     or char_length(coalesce(new.emergency_relationship,'')) > 60
     or char_length(coalesce(new.accessibility_notes,'')) > 1000 then
    raise exception 'One of the entries is too long. Please shorten it.';
  end if;

  select * into v_category from public.run_categories where id = new.category_id;
  if not found or v_category.run_event_id <> new.run_event_id then
    raise exception 'The selected category is unavailable.';
  end if;

  select coalesce(ed.run_date, current_date) into v_run_date
  from public.run_events ev
  join public.editions ed on ed.id = ev.edition_id
  where ev.id = new.run_event_id;

  v_age := date_part('year', age(v_run_date, new.birth_date))::integer;
  if v_category.min_age is not null and v_age < v_category.min_age then
    raise exception 'This category requires a minimum age of % on race day.', v_category.min_age;
  end if;
  if v_category.max_age is not null and v_age > v_category.max_age then
    raise exception 'This category has a maximum age of % on race day.', v_category.max_age;
  end if;

  if v_category.capacity is not null and (
    select count(*) from public.run_registrations
    where category_id = new.category_id and status not in ('rejected','cancelled')
  ) >= v_category.capacity then
    raise exception 'The selected category is already full.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_run_registration_rules on public.run_registrations;
create trigger enforce_run_registration_rules
before insert on public.run_registrations
for each row execute function public.enforce_run_registration_rules();

-- ---------------------------------------------------------------------------
-- B. Payment submission
-- ---------------------------------------------------------------------------
-- The body below keeps the behaviour of 011_cash_payments_and_finance.sql and adds guards.
create or replace function public.mark_manual_payment_submitted(
  p_payment_id uuid,
  p_method text,
  p_payer_reference text default null,
  p_received_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_method text := lower(trim(p_method));
  v_payment public.payments;
  v_registration_status public.review_status;
  v_reference text := nullif(trim(coalesce(p_payer_reference, '')), '');
begin
  select p.* into v_payment
  from public.payments p
  join public.run_registrations r on r.id = p.registration_id
  where p.id = p_payment_id and r.user_id = auth.uid()
  for update of p;
  if not found then raise exception 'Payment record was not found.'; end if;

  select status into v_registration_status
  from public.run_registrations where id = v_payment.registration_id;

  if v_payment.status not in ('unpaid','submitted','rejected') then
    raise exception 'This payment can no longer be changed.';
  end if;
  if v_registration_status in ('rejected','cancelled') then
    raise exception 'This registration is closed, so a payment cannot be submitted.';
  end if;
  if not exists(select 1 from public.payment_evidence where payment_id = p_payment_id) then
    raise exception 'Upload proof of payment first.';
  end if;
  if v_method not in ('gcash', 'cash') then raise exception 'Select GCash or Cash.'; end if;
  if v_method = 'gcash' and (v_reference is null or char_length(v_reference) < 4 or char_length(v_reference) > 100) then
    raise exception 'Enter the GCash reference number shown on your receipt.';
  end if;
  if v_method = 'cash' and not exists(
    select 1 from public.profiles p
    join public.user_roles r on r.user_id = p.id and r.role = 'admin'
    where p.id = p_received_by and p.suspended_at is null
  ) then raise exception 'Select the administrator who received the cash payment.'; end if;

  update public.payments
  set method = case when v_method = 'gcash' then 'GCash' else 'Cash' end,
      payer_reference = case when v_method = 'gcash' then v_reference else null end,
      received_by = case when v_method = 'cash' then p_received_by else null end,
      status = 'submitted', submitted_at = now(), rejection_reason = null,
      updated_at = now()
  where id = p_payment_id;
end;
$$;
revoke all on function public.mark_manual_payment_submitted(uuid,text,text,uuid) from public;
grant execute on function public.mark_manual_payment_submitted(uuid,text,text,uuid) to authenticated;

-- Older GCash-only function (no longer used by the app): same guards.
create or replace function public.mark_gcash_payment_submitted(
  p_payment_id uuid,
  p_payer_reference text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_registration_status public.review_status;
  v_reference text := trim(coalesce(p_payer_reference, ''));
begin
  select p.* into v_payment
  from public.payments p
  join public.run_registrations r on r.id = p.registration_id
  where p.id = p_payment_id and r.user_id = auth.uid()
  for update of p;
  if not found then raise exception 'Payment record was not found.'; end if;
  select status into v_registration_status
  from public.run_registrations where id = v_payment.registration_id;

  if v_payment.status not in ('unpaid','submitted','rejected') then
    raise exception 'This payment can no longer be changed.';
  end if;
  if v_registration_status in ('rejected','cancelled') then
    raise exception 'This registration is closed, so a payment cannot be submitted.';
  end if;
  if char_length(v_reference) < 4 or char_length(v_reference) > 100 then
    raise exception 'Enter the GCash reference number shown on your receipt.';
  end if;
  if not exists(select 1 from public.payment_evidence where payment_id = p_payment_id) then
    raise exception 'Upload a payment screenshot first.';
  end if;

  update public.payments
  set method = 'GCash', payer_reference = v_reference,
      status = 'submitted', submitted_at = now(), rejection_reason = null,
      updated_at = now()
  where id = p_payment_id;
end;
$$;
revoke all on function public.mark_gcash_payment_submitted(uuid,text) from public;
grant execute on function public.mark_gcash_payment_submitted(uuid,text) to authenticated;

-- ---------------------------------------------------------------------------
-- C. Payment evidence protection
-- ---------------------------------------------------------------------------
create or replace function public.evidence_locked(p_object_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.payment_evidence e
    join public.payments p on p.id = e.payment_id
    where e.object_path = p_object_path
      and p.status in ('submitted','verified','refunded')
  )
$$;
revoke all on function public.evidence_locked(text) from public;
grant execute on function public.evidence_locked(text) to authenticated;

-- Evidence rows: own payment, own folder, payment still open.
drop policy if exists "runners add own payment evidence" on public.payment_evidence;
create policy "runners add own payment evidence"
  on public.payment_evidence for insert to authenticated
  with check(
    (storage.foldername(object_path))[1] = auth.uid()::text
    and exists(
      select 1 from public.payments p
      join public.run_registrations r on r.id = p.registration_id
      where p.id = payment_id and r.user_id = auth.uid()
        and p.status in ('unpaid','submitted','rejected')
    )
  );

-- Files: a runner can no longer delete or overwrite a screenshot that backs a
-- submitted, verified or refunded payment.
drop policy if exists "runners delete own evidence objects" on storage.objects;
create policy "runners delete own evidence objects"
  on storage.objects for delete to authenticated
  using(bucket_id = 'payment-evidence'
        and (storage.foldername(name))[1] = auth.uid()::text
        and not public.evidence_locked(name));

drop policy if exists "runners replace own evidence objects" on storage.objects;
create policy "runners replace own evidence objects"
  on storage.objects for update to authenticated
  using(bucket_id = 'payment-evidence'
        and (storage.foldername(name))[1] = auth.uid()::text
        and not public.evidence_locked(name));

-- Consent rows are written only by the registration functions.
drop policy if exists "runners add own consents" on public.registration_consents;

-- ---------------------------------------------------------------------------
-- D. Last active administrator protection
-- ---------------------------------------------------------------------------
create or replace function public.protect_last_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
  v_remaining integer;
begin
  if old.role <> 'admin' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  -- An update that keeps the same admin role for the same person is harmless.
  if tg_op = 'UPDATE' then
    if new.role = 'admin' and new.user_id = old.user_id then return new; end if;
  end if;

  v_target := old.user_id;
  -- Only an active (not suspended) admin counts.
  if not exists(select 1 from public.profiles where id = v_target and suspended_at is null) then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('sinoog-last-admin', 0));
  select count(*) into v_remaining
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id
  where ur.role = 'admin' and ur.user_id <> v_target and p.suspended_at is null;

  if v_remaining = 0 then
    raise exception 'The last active administrator cannot be removed.';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists protect_last_admin_role on public.user_roles;
create trigger protect_last_admin_role
before delete or update of role, user_id on public.user_roles
for each row execute function public.protect_last_admin_role();

create or replace function public.protect_last_admin_suspension()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_remaining integer;
begin
  if old.suspended_at is null and new.suspended_at is not null
     and exists(select 1 from public.user_roles where user_id = old.id and role = 'admin') then
    perform pg_advisory_xact_lock(hashtextextended('sinoog-last-admin', 0));
    select count(*) into v_remaining
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.role = 'admin' and ur.user_id <> old.id and p.suspended_at is null;
    if v_remaining = 0 then
      raise exception 'The last active administrator cannot be suspended.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_last_admin_suspension on public.profiles;
create trigger protect_last_admin_suspension
before update of suspended_at on public.profiles
for each row execute function public.protect_last_admin_suspension();

-- ---------------------------------------------------------------------------
-- E. Audit trail for sensitive changes
-- ---------------------------------------------------------------------------
create or replace function public.audit_sensitive_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'user_roles' then
    if tg_op = 'INSERT' then
      if new.role <> 'public_user' then
        insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
        values (auth.uid(), 'role_granted', 'user_roles', new.user_id::text, jsonb_build_object('role', new.role));
      end if;
    elsif tg_op = 'DELETE' then
      if old.role <> 'public_user' then
        insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
        values (case when old.user_id = auth.uid() then null else auth.uid() end,
                'role_revoked', 'user_roles', old.user_id::text, jsonb_build_object('role', old.role));
      end if;
    end if;
  elsif tg_table_name = 'profiles' then
    if new.suspended_at is distinct from old.suspended_at then
      insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
      values (auth.uid(),
              case when new.suspended_at is not null then 'account_suspended' else 'account_reactivated' end,
              'profiles', new.id::text, '{}'::jsonb);
    end if;
  elsif tg_table_name = 'editions' then
    if new.registration_open is distinct from old.registration_open then
      insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
      values (auth.uid(), 'registration_open_changed', 'editions', new.id::text,
              jsonb_build_object('registration_open', new.registration_open));
    end if;
  elsif tg_table_name = 'run_events' then
    if new.gcash_number is distinct from old.gcash_number
       or new.gcash_account_name is distinct from old.gcash_account_name then
      insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
      values (auth.uid(), 'payment_destination_changed', 'run_events', new.id::text,
              jsonb_build_object('old_gcash_number', old.gcash_number, 'new_gcash_number', new.gcash_number,
                                 'old_account_name', old.gcash_account_name, 'new_account_name', new.gcash_account_name));
    end if;
  elsif tg_table_name = 'run_categories' then
    if new.fee_centavos is distinct from old.fee_centavos
       or new.capacity is distinct from old.capacity
       or new.published is distinct from old.published then
      insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
      values (auth.uid(), 'run_category_changed', 'run_categories', new.id::text,
              jsonb_build_object('fee_centavos', jsonb_build_array(old.fee_centavos, new.fee_centavos),
                                 'capacity', jsonb_build_array(old.capacity, new.capacity),
                                 'published', jsonb_build_array(old.published, new.published)));
    end if;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists audit_user_roles on public.user_roles;
create trigger audit_user_roles after insert or delete on public.user_roles
for each row execute function public.audit_sensitive_changes();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update of suspended_at on public.profiles
for each row execute function public.audit_sensitive_changes();

drop trigger if exists audit_editions on public.editions;
create trigger audit_editions after update of registration_open on public.editions
for each row execute function public.audit_sensitive_changes();

drop trigger if exists audit_run_events on public.run_events;
create trigger audit_run_events after update of gcash_number, gcash_account_name on public.run_events
for each row execute function public.audit_sensitive_changes();

drop trigger if exists audit_run_categories on public.run_categories;
create trigger audit_run_categories after update of fee_centavos, capacity, published on public.run_categories
for each row execute function public.audit_sensitive_changes();

-- ---------------------------------------------------------------------------
-- F. Sponsor links must be web addresses (NOT VALID: checks new and edited rows only,
--    so existing rows are not blocked; the admin form normalises addresses before saving)
-- ---------------------------------------------------------------------------
alter table public.sponsors drop constraint if exists sponsors_website_url_http;
alter table public.sponsors add constraint sponsors_website_url_http
  check (website_url is null or website_url ~* '^https?://[^[:space:]]+$') not valid;

alter table public.sponsors drop constraint if exists sponsors_facebook_url_http;
alter table public.sponsors add constraint sponsors_facebook_url_http
  check (facebook_url is null or facebook_url ~* '^https?://[^[:space:]]+$') not valid;

commit;
