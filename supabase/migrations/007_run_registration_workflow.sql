-- Sinoog Run 2027 registration, GCash review, bib, and QR workflow.
-- Run manually in Supabase SQL Editor after migrations 001-006.

begin;

alter table public.run_events
  add column if not exists race_starts_at timestamptz,
  add column if not exists official_started_at timestamptz,
  add column if not exists official_started_by uuid references public.profiles(id),
  add column if not exists gcash_number text,
  add column if not exists gcash_account_name text;

alter table public.run_registrations
  add column if not exists bib_number text,
  add column if not exists qr_token uuid,
  add column if not exists division text,
  add column if not exists registration_source text not null default 'online',
  add column if not exists registered_by uuid references public.profiles(id);

alter table public.run_registrations
  drop constraint if exists run_registrations_bib_number_format;
alter table public.run_registrations
  add constraint run_registrations_bib_number_format
  check (bib_number is null or bib_number ~ '^[0-9]{4}$');
alter table public.run_registrations drop constraint if exists run_registrations_division_check;
alter table public.run_registrations add constraint run_registrations_division_check
  check (division is null or division in ('male','female'));
alter table public.run_registrations drop constraint if exists run_registrations_source_check;
alter table public.run_registrations add constraint run_registrations_source_check
  check (registration_source in ('online','admin_cash'));

create table if not exists public.run_finish_records (
  registration_id uuid primary key references public.run_registrations(id) on delete cascade,
  run_event_id uuid not null references public.run_events(id) on delete cascade,
  category_id uuid not null references public.run_categories(id),
  division text not null check (division in ('male','female')),
  finished_at timestamptz not null,
  elapsed_milliseconds bigint not null check (elapsed_milliseconds >= 0),
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists run_finish_rank_idx
  on public.run_finish_records(category_id, division, elapsed_milliseconds);
alter table public.run_finish_records enable row level security;
drop policy if exists "runners read own finish or admins read all" on public.run_finish_records;
create policy "runners read own finish or admins read all"
  on public.run_finish_records for select to authenticated
  using(public.has_role('admin') or exists(
    select 1 from public.run_registrations r
    where r.id = registration_id and r.user_id = auth.uid()
  ));

create unique index if not exists run_registrations_event_bib_unique
  on public.run_registrations(run_event_id, bib_number)
  where bib_number is not null;
create unique index if not exists run_registrations_qr_token_unique
  on public.run_registrations(qr_token)
  where qr_token is not null;
create unique index if not exists run_categories_event_distance_unique
  on public.run_categories(run_event_id, distance_meters);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('payment-evidence', 'payment-evidence', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict(id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "runners delete own evidence objects" on storage.objects;
create policy "runners delete own evidence objects"
  on storage.objects for delete to authenticated
  using(bucket_id = 'payment-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "runners delete own payment evidence" on public.payment_evidence;
create policy "runners delete own payment evidence"
  on public.payment_evidence for delete to authenticated
  using(exists(
    select 1 from public.payments p
    join public.run_registrations r on r.id = p.registration_id
    where p.id = payment_id and r.user_id = auth.uid() and p.status in ('unpaid','rejected')
  ));

with e as (
  select id from public.editions where year = 2027
)
insert into public.run_events(edition_id, title, gcash_number)
select id, 'Sinoog Run 2027', '09260265423'
from e
on conflict(edition_id) do update
set gcash_number = excluded.gcash_number,
    updated_at = now();

with event as (
  select re.id
  from public.run_events re
  join public.editions e on e.id = re.edition_id
  where e.year = 2027
), category(distance_meters, name, fee_centavos, kit_description, sort_order) as (
  values
    (3000,  '3K Fun Run / Family Walk', 50000,  'Official Sinoog 2027 Singlet, Race Bib, Finisher Ribbon, Post-race Refreshment', 1),
    (5000,  '5K Community Stride',       80000,  'Official Sinoog 2027 Singlet, Race Bib, Finisher Medal, Hydration Support', 2),
    (10000, '10K Sto. Niño Fiesta Loop', 100000, 'Official Sinoog 2027 Singlet, Timing Bib, Heavy Cast Finisher Medal, Energy Station & Hot Meal', 3)
)
insert into public.run_categories(
  run_event_id, name, distance_meters, fee_centavos, capacity,
  min_age, max_age, kit_description, published, sort_order
)
select event.id, category.name, category.distance_meters, category.fee_centavos,
       null, null, null, category.kit_description, true, category.sort_order
from event cross join category
on conflict(run_event_id, distance_meters) do update
set name = excluded.name,
    fee_centavos = excluded.fee_centavos,
    kit_description = excluded.kit_description,
    published = excluded.published,
    sort_order = excluded.sort_order;

insert into public.run_routes(category_id, route_notes, published)
select c.id,
  'Sto. Niño Guinacot Parish -> Stampa Cabantian -> Cansiwang Road -> Guinacot High School Road -> Back to Parish',
  true
from public.run_categories c
join public.run_events re on re.id = c.run_event_id
join public.editions e on e.id = re.edition_id
where e.year = 2027 and c.distance_meters = 10000
on conflict(category_id) do update
set route_notes = excluded.route_notes,
    published = excluded.published,
    updated_at = now();

-- Runners may read their own registration, but may not directly change approval,
-- fee, bib, QR, or other protected fields. Submission/review uses trusted functions.
drop policy if exists "runners manage own registration" on public.run_registrations;
drop policy if exists "runners read own registration" on public.run_registrations;
drop policy if exists "admins manage registrations" on public.run_registrations;
create policy "runners read own registration"
  on public.run_registrations for select to authenticated
  using(user_id = auth.uid() or public.has_role('admin'));
create policy "admins manage registrations"
  on public.run_registrations for all to authenticated
  using(public.has_role('admin'))
  with check(public.has_role('admin'));

create or replace function public.submit_run_registration(
  p_run_event_id uuid,
  p_category_id uuid,
  p_participant_name text,
  p_division text,
  p_birth_date date,
  p_mobile text,
  p_locality text,
  p_shirt_size text,
  p_club_name text,
  p_emergency_name text,
  p_emergency_relationship text,
  p_emergency_mobile text,
  p_accessibility_notes text
)
returns public.run_registrations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.run_events;
  v_category public.run_categories;
  v_edition public.editions;
  v_registration public.run_registrations;
begin
  if v_user_id is null then raise exception 'Sign in before registering.'; end if;
  if not exists(select 1 from auth.users where id = v_user_id and email_confirmed_at is not null) then
    raise exception 'Confirm your email address before registering.';
  end if;

  select * into v_event from public.run_events where id = p_run_event_id;
  if not found then raise exception 'Run event was not found.'; end if;
  select * into v_edition from public.editions where id = v_event.edition_id;
  if not v_edition.registration_open then raise exception 'Registration is currently closed.'; end if;
  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then
    raise exception 'Registration has not opened yet.';
  end if;
  if v_event.registration_closes_at is not null and now() > v_event.registration_closes_at then
    raise exception 'The registration deadline has passed.';
  end if;

  select * into v_category
  from public.run_categories
  where id = p_category_id and run_event_id = p_run_event_id and published;
  if not found then raise exception 'The selected category is unavailable.'; end if;
  if v_category.capacity is not null and (
    select count(*) from public.run_registrations
    where category_id = v_category.id and status not in ('rejected','cancelled')
  ) >= v_category.capacity then
    raise exception 'The selected category is already full.';
  end if;

  insert into public.run_registrations(
    run_event_id, category_id, user_id, participant_name, division, birth_date, mobile,
    locality, shirt_size, club_name, emergency_name, emergency_relationship,
    emergency_mobile, accessibility_notes, fee_centavos, currency, status, submitted_at
  ) values (
    p_run_event_id, p_category_id, v_user_id, trim(p_participant_name), lower(trim(p_division)), p_birth_date,
    trim(p_mobile), nullif(trim(p_locality),''), nullif(trim(p_shirt_size),''),
    nullif(trim(p_club_name),''), trim(p_emergency_name),
    nullif(trim(p_emergency_relationship),''), trim(p_emergency_mobile),
    nullif(trim(p_accessibility_notes),''), v_category.fee_centavos, 'PHP',
    'submitted', now()
  ) returning * into v_registration;

  insert into public.payments(registration_id, method, amount_centavos, currency, status)
  values(v_registration.id, 'GCash', v_category.fee_centavos, 'PHP', 'unpaid');

  insert into public.registration_consents(registration_id, consent_type, version, accepted)
  values
    (v_registration.id, 'terms', coalesce(v_event.terms_version,'2027-v1'), true),
    (v_registration.id, 'privacy', coalesce(v_event.privacy_version,'2027-v1'), true);

  return v_registration;
exception
  when unique_violation then
    raise exception 'You already have a registration for this Sinoog Run.';
end;
$$;

revoke all on function public.submit_run_registration(uuid,uuid,text,text,date,text,text,text,text,text,text,text,text) from public;
grant execute on function public.submit_run_registration(uuid,uuid,text,text,date,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.mark_gcash_payment_submitted(
  p_payment_id uuid,
  p_payer_reference text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(
    select 1 from public.payments p
    join public.run_registrations r on r.id = p.registration_id
    where p.id = p_payment_id and r.user_id = auth.uid()
  ) then raise exception 'Payment record was not found.'; end if;
  if not exists(select 1 from public.payment_evidence where payment_id = p_payment_id) then
    raise exception 'Upload a payment screenshot first.';
  end if;
  update public.payments
  set method = 'GCash', payer_reference = trim(p_payer_reference),
      status = 'submitted', submitted_at = now(), rejection_reason = null,
      updated_at = now()
  where id = p_payment_id;
end;
$$;

revoke all on function public.mark_gcash_payment_submitted(uuid,text) from public;
grant execute on function public.mark_gcash_payment_submitted(uuid,text) to authenticated;

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
  v_next_bib integer;
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
      raise exception 'A submitted GCash payment proof is required before approval.';
    end if;
    if not exists(select 1 from public.payment_evidence where payment_id = v_payment.id) then
      raise exception 'Payment evidence is missing.';
    end if;

    update public.payments
    set status = 'verified', verified_by = auth.uid(), verified_at = now(),
        rejection_reason = null, updated_at = now()
    where id = v_payment.id;

    if v_registration.bib_number is null then
      perform pg_advisory_xact_lock(hashtextextended(v_registration.run_event_id::text, 0));
      select coalesce(max(bib_number::integer), 0) + 1 into v_next_bib
      from public.run_registrations
      where run_event_id = v_registration.run_event_id
        and bib_number ~ '^[0-9]{4}$';
      if v_next_bib > 9999 then raise exception 'All four-digit bib numbers have been allocated.'; end if;
      v_registration.bib_number := lpad(v_next_bib::text, 4, '0');
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

create or replace function public.start_run_timing(p_run_event_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare v_started_at timestamptz;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;
  update public.run_events
  set official_started_at = coalesce(official_started_at, clock_timestamp()),
      official_started_by = coalesce(official_started_by, auth.uid()),
      updated_at = now()
  where id = p_run_event_id
  returning official_started_at into v_started_at;
  if v_started_at is null then raise exception 'Run event was not found.'; end if;
  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'run_officially_started', 'run_events', p_run_event_id::text,
    jsonb_build_object('official_started_at',v_started_at));
  return v_started_at;
end;
$$;
revoke all on function public.start_run_timing(uuid) from public;
grant execute on function public.start_run_timing(uuid) to authenticated;

create or replace function public.record_run_finish(p_qr_token uuid)
returns public.run_finish_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.run_registrations;
  v_event public.run_events;
  v_finish public.run_finish_records;
  v_finished_at timestamptz := clock_timestamp();
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;
  select * into v_registration
  from public.run_registrations
  where qr_token = p_qr_token and status = 'approved';
  if not found then raise exception 'Approved runner QR code was not found.'; end if;
  select * into v_event from public.run_events where id = v_registration.run_event_id;
  if v_event.official_started_at is null then raise exception 'Click Official Start before recording finishers.'; end if;
  if v_registration.division is null then raise exception 'Runner division is missing.'; end if;

  insert into public.run_finish_records(
    registration_id, run_event_id, category_id, division,
    finished_at, elapsed_milliseconds, recorded_by
  ) values (
    v_registration.id, v_registration.run_event_id, v_registration.category_id,
    v_registration.division, v_finished_at,
    floor(extract(epoch from (v_finished_at - v_event.official_started_at)) * 1000)::bigint,
    auth.uid()
  ) returning * into v_finish;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'run_finish_recorded', 'run_finish_records', v_registration.id::text,
    jsonb_build_object('bib_number',v_registration.bib_number,'elapsed_milliseconds',v_finish.elapsed_milliseconds));
  return v_finish;
exception
  when unique_violation then raise exception 'This runner already has an official finish record.';
end;
$$;
revoke all on function public.record_run_finish(uuid) from public;
grant execute on function public.record_run_finish(uuid) to authenticated;

create or replace function public.get_my_run_result(p_registration_id uuid)
returns table(
  finished_at timestamptz,
  elapsed_milliseconds bigint,
  division_rank bigint,
  category_rank bigint,
  overall_rank bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select f.*,
      rank() over(partition by f.category_id, f.division order by f.elapsed_milliseconds) as division_rank,
      rank() over(partition by f.category_id order by f.elapsed_milliseconds) as category_rank,
      rank() over(partition by f.run_event_id order by f.elapsed_milliseconds) as overall_rank
    from public.run_finish_records f
  )
  select r.finished_at, r.elapsed_milliseconds, r.division_rank, r.category_rank, r.overall_rank
  from ranked r
  join public.run_registrations registration on registration.id = r.registration_id
  where r.registration_id = p_registration_id
    and (registration.user_id = auth.uid() or public.has_role('admin'));
$$;
revoke all on function public.get_my_run_result(uuid) from public;
grant execute on function public.get_my_run_result(uuid) to authenticated;

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
  select coalesce(max(bib_number::integer), 0) + 1 into v_next_bib
  from public.run_registrations
  where run_event_id = p_run_event_id and bib_number ~ '^[0-9]{4}$';
  if v_next_bib > 9999 then raise exception 'All four-digit bib numbers have been allocated.'; end if;

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
    'PHP', 'approved', now(), p_admin_id, now(), lpad(v_next_bib::text,4,'0'), gen_random_uuid(),
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
revoke all on function public.admin_register_cash_runner(uuid,uuid,uuid,uuid,text,text,date,text,text,text,text,text,text,text,text,boolean) from public;
grant execute on function public.admin_register_cash_runner(uuid,uuid,uuid,uuid,text,text,date,text,text,text,text,text,text,text,text,boolean) to service_role;

commit;

select e.year, re.title, re.gcash_number, re.registration_closes_at, re.race_starts_at,
       c.distance_meters, c.name, c.fee_centavos, c.kit_description, c.published
from public.run_events re
join public.editions e on e.id = re.edition_id
join public.run_categories c on c.run_event_id = re.id
where e.year = 2027
order by c.sort_order;
