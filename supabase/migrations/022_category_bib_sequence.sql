-- Migration 022: Category-Specific Bib Number Sequences & 4-5 Digit Format Support
-- 3K: 3001-3999 (3 + 3 digits)
-- 5K: 5001-5999 (5 + 3 digits)
-- 10K: 10001-10999 (10 + 3 digits)

begin;

-- Update bib number constraint to allow 4 to 5 digits (3001-3999, 5001-5999, 10001-10999)
alter table public.run_registrations
  drop constraint if exists run_registrations_bib_number_format;

alter table public.run_registrations
  add constraint run_registrations_bib_number_format
  check (bib_number is null or bib_number ~ '^[0-9]{4,5}$');

-- Update review_run_registration to assign category-specific bib numbers
create or replace function public.review_run_registration(
  p_registration_id uuid,
  p_status public.review_status,
  p_review_notes text default null
)
returns public.run_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.run_registrations;
  v_payment public.payments;
  v_category public.run_categories;
  v_next_bib integer;
  v_min_bib integer;
  v_max_bib integer;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;
  if p_status not in ('approved','needs_changes','rejected','cancelled') then
    raise exception 'Unsupported review status.';
  end if;

  select * into v_registration
  from public.run_registrations
  where id = p_registration_id
  for update;
  if not found then raise exception 'Registration was not found.'; end if;

  if p_status = 'approved' then
    select * into v_payment
    from public.payments
    where registration_id = p_registration_id
    order by created_at desc
    limit 1
    for update;
    if not found or v_payment.status not in ('submitted','verified') then
      raise exception 'A submitted or verified payment is required before approval.';
    end if;
    if lower(v_payment.method) <> 'cash'
       and not exists(select 1 from public.payment_evidence where payment_id = v_payment.id) then
      raise exception 'Payment evidence is missing.';
    end if;

    update public.payments
    set status = 'verified', verified_by = coalesce(verified_by, auth.uid()),
        verified_at = coalesce(verified_at, now()), rejection_reason = null, updated_at = now()
    where id = v_payment.id;

    if v_registration.bib_number is null then
      perform pg_advisory_xact_lock(hashtextextended(v_registration.run_event_id::text, 0));
      
      select * into v_category
      from public.run_categories
      where id = v_registration.category_id;

      if v_category.distance_meters = 10000 or v_category.name ilike '%10K%' then
        v_min_bib := 10000;
        v_max_bib := 10999;
      elsif v_category.distance_meters = 5000 or v_category.name ilike '%5K%' then
        v_min_bib := 5000;
        v_max_bib := 5999;
      else
        -- 3K or other
        v_min_bib := 3000;
        v_max_bib := 3999;
      end if;

      select coalesce(max(bib_number::integer), v_min_bib) + 1 into v_next_bib
      from public.run_registrations
      where run_event_id = v_registration.run_event_id
        and bib_number ~ '^[0-9]{4,5}$'
        and bib_number::integer between (v_min_bib + 1) and v_max_bib;

      if v_next_bib > v_max_bib then
        raise exception 'All bib numbers for this category have been allocated.';
      end if;

      v_registration.bib_number := v_next_bib::text;
    end if;
    if v_registration.qr_token is null then v_registration.qr_token := gen_random_uuid(); end if;
  end if;

  update public.run_registrations
  set status = p_status,
      review_notes = nullif(trim(p_review_notes),''),
      reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now(),
      bib_number = v_registration.bib_number,
      qr_token = v_registration.qr_token
  where id = p_registration_id
  returning * into v_registration;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'run_registration_reviewed', 'run_registrations', p_registration_id::text,
    jsonb_build_object('status',p_status,'bib_number',v_registration.bib_number));
  return v_registration;
end;
$$;

revoke all on function public.review_run_registration(uuid,public.review_status,text) from public;
grant execute on function public.review_run_registration(uuid,public.review_status,text) to authenticated;

-- Update admin_register_cash_runner to assign category-specific bib numbers
create or replace function public.admin_register_cash_runner(
  p_admin_id uuid,
  p_user_id uuid,
  p_run_event_id uuid,
  p_category_id uuid,
  p_participant_name text,
  p_division text,
  p_birth_date date,
  p_mobile text,
  p_full_address text,
  p_shirt_size text,
  p_club_name text,
  p_emergency_name text,
  p_emergency_relationship text,
  p_emergency_mobile text,
  p_accessibility_notes text,
  p_offline_consent_confirmed boolean
)
returns public.run_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.run_events;
  v_category public.run_categories;
  v_registration public.run_registrations;
  v_next_bib integer;
  v_min_bib integer;
  v_max_bib integer;
begin
  if not exists(select 1 from public.user_roles where user_id = p_admin_id and role = 'admin') then
    raise exception 'Administrator access required.';
  end if;
  if not p_offline_consent_confirmed then
    raise exception 'Confirm that the runner signed the offline waiver and privacy notice.';
  end if;
  select * into v_event from public.run_events where id = p_run_event_id;
  if not found then raise exception 'Run event was not found.'; end if;
  select * into v_category from public.run_categories
  where id = p_category_id and run_event_id = p_run_event_id and published;
  if not found then raise exception 'The selected category is unavailable.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_run_event_id::text, 0));
  if v_category.capacity is not null and (
    select count(*) from public.run_registrations
    where category_id = p_category_id and status not in ('rejected','cancelled')
  ) >= v_category.capacity then
    raise exception 'The selected category is already full.';
  end if;

  if v_category.distance_meters = 10000 or v_category.name ilike '%10K%' then
    v_min_bib := 10000;
    v_max_bib := 10999;
  elsif v_category.distance_meters = 5000 or v_category.name ilike '%5K%' then
    v_min_bib := 5000;
    v_max_bib := 5999;
  else
    v_min_bib := 3000;
    v_max_bib := 3999;
  end if;

  select coalesce(max(bib_number::integer), v_min_bib) + 1 into v_next_bib
  from public.run_registrations
  where run_event_id = p_run_event_id
    and bib_number ~ '^[0-9]{4,5}$'
    and bib_number::integer between (v_min_bib + 1) and v_max_bib;

  if v_next_bib > v_max_bib then
    raise exception 'All bib numbers for this category have been allocated.';
  end if;

  insert into public.run_registrations(
    run_event_id, category_id, user_id, participant_name, division, birth_date,
    mobile, locality, shirt_size, club_name, emergency_name, emergency_relationship,
    emergency_mobile, accessibility_notes, fee_centavos, currency, status,
    submitted_at, reviewed_by, reviewed_at, bib_number, qr_token,
    registration_source, registered_by
  ) values (
    p_run_event_id, p_category_id, p_user_id, trim(p_participant_name), lower(trim(p_division)),
    p_birth_date, trim(p_mobile), nullif(trim(p_full_address),''), nullif(trim(p_shirt_size),''),
    nullif(trim(p_club_name),''), trim(p_emergency_name), nullif(trim(p_emergency_relationship),''),
    trim(p_emergency_mobile), nullif(trim(p_accessibility_notes),''), v_category.fee_centavos,
    'PHP', 'approved', now(), p_admin_id, now(), v_next_bib::text, gen_random_uuid(),
    'admin_cash', p_admin_id
  ) returning * into v_registration;

  insert into public.payments(
    registration_id, method, amount_centavos, currency, payer_reference,
    status, submitted_at, verified_by, verified_at
  ) values (
    v_registration.id, 'Cash', v_category.fee_centavos, 'PHP', 'CASH-' || v_registration.reference,
    'verified', now(), p_admin_id, now()
  );
  insert into public.registration_consents(registration_id, consent_type, version, accepted)
  values
    (v_registration.id, 'terms', coalesce(v_event.terms_version,'2027-v1-offline'), true),
    (v_registration.id, 'privacy', coalesce(v_event.privacy_version,'2027-v1-offline'), true);
  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(p_admin_id, 'admin_cash_runner_registered', 'run_registrations', v_registration.id::text,
    jsonb_build_object('runner_user_id',p_user_id,'bib_number',v_registration.bib_number,'payment_method','Cash'));
  return v_registration;
exception
  when unique_violation then raise exception 'This runner account already has a registration for the event.';
end;
$$;

commit;
