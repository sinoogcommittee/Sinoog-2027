-- Migration 023: Staggered Category Gun Starts for Sinoog Run 2027
-- Planned Starts:
-- 10K: 04:00:00 (4:00 AM)
-- 5K:  04:30:00 (4:30 AM)
-- 3K:  05:00:00 (5:00 AM)

begin;

-- Add category-specific timing columns to public.run_categories
alter table public.run_categories
  add column if not exists official_started_at timestamptz,
  add column if not exists official_started_by uuid references public.profiles(id),
  add column if not exists planned_start_time text;

-- Seed planned start times for current edition
update public.run_categories
set planned_start_time = case
  when name ilike '%10K%' or distance_meters = 10000 then '04:00:00'
  when name ilike '%5K%' or distance_meters = 5000 then '04:30:00'
  when name ilike '%3K%' or distance_meters = 3000 then '05:00:00'
  else '04:00:00'
end
where planned_start_time is null;

-- RPC to start a specific category's official race clock
create or replace function public.start_category_timing(p_category_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started_at timestamptz := clock_timestamp();
  v_category public.run_categories;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;

  select * into v_category
  from public.run_categories
  where id = p_category_id
  for update;

  if not found then raise exception 'Run category was not found.'; end if;

  if v_category.official_started_at is not null then
    return v_category.official_started_at;
  end if;

  update public.run_categories
  set official_started_at = v_started_at,
      official_started_by = auth.uid()
  where id = p_category_id;

  -- Ensure run_events.official_started_at is set to the earliest category start
  update public.run_events
  set official_started_at = coalesce(official_started_at, v_started_at),
      official_started_by = coalesce(official_started_by, auth.uid()),
      updated_at = now()
  where id = v_category.run_event_id;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'category_officially_started', 'run_categories', p_category_id::text,
    jsonb_build_object(
      'category_name', v_category.name,
      'distance_meters', v_category.distance_meters,
      'official_started_at', v_started_at
    ));

  return v_started_at;
end;
$$;

revoke all on function public.start_category_timing(uuid) from public;
grant execute on function public.start_category_timing(uuid) to authenticated;

-- RPC to reset a specific category's official race clock and finish records
create or replace function public.reset_category_timing(p_category_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finish_count integer;
  v_category public.run_categories;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;

  select * into v_category
  from public.run_categories
  where id = p_category_id
  for update;

  if not found then raise exception 'Run category was not found.'; end if;

  select count(*)::integer into v_finish_count
  from public.run_finish_records
  where category_id = p_category_id;

  delete from public.run_finish_records
  where category_id = p_category_id;

  update public.run_categories
  set official_started_at = null,
      official_started_by = null
  where id = p_category_id;

  -- If no categories remain started, reset run_events.official_started_at as well
  if not exists (
    select 1 from public.run_categories
    where run_event_id = v_category.run_event_id and official_started_at is not null
  ) then
    update public.run_events
    set official_started_at = null,
        official_started_by = null,
        updated_at = now()
    where id = v_category.run_event_id;
  end if;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'category_timing_reset', 'run_categories', p_category_id::text,
    jsonb_build_object(
      'category_name', v_category.name,
      'deleted_finish_records', v_finish_count
    ));

  return v_finish_count;
end;
$$;

revoke all on function public.reset_category_timing(uuid) from public;
grant execute on function public.reset_category_timing(uuid) to authenticated;

-- Update record_run_finish to use category-specific start time
create or replace function public.record_run_finish(p_qr_token uuid)
returns public.run_finish_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.run_registrations;
  v_category public.run_categories;
  v_event public.run_events;
  v_finish public.run_finish_records;
  v_finished_at timestamptz := clock_timestamp();
  v_start_time timestamptz;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;

  select * into v_registration
  from public.run_registrations
  where qr_token = p_qr_token and status = 'approved';
  if not found then raise exception 'Approved runner QR code was not found.'; end if;

  select * into v_category
  from public.run_categories
  where id = v_registration.category_id;
  if not found then raise exception 'Runner category was not found.'; end if;

  select * into v_event
  from public.run_events
  where id = v_registration.run_event_id;
  if not found then raise exception 'Run event was not found.'; end if;

  -- The actual time to follow is the category's official start, falling back to event start if not set
  v_start_time := coalesce(v_category.official_started_at, v_event.official_started_at);

  if v_start_time is null then
    raise exception 'The official race clock for % has not been started yet.', coalesce(v_category.name, 'this category');
  end if;

  if v_registration.division is null then raise exception 'Runner division is missing.'; end if;

  insert into public.run_finish_records(
    registration_id, run_event_id, category_id, division,
    finished_at, elapsed_milliseconds, recorded_by
  ) values (
    v_registration.id, v_registration.run_event_id, v_registration.category_id,
    v_registration.division, v_finished_at,
    greatest(0, floor(extract(epoch from (v_finished_at - v_start_time)) * 1000)::bigint),
    auth.uid()
  ) returning * into v_finish;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'run_finish_recorded', 'run_finish_records', v_registration.id::text,
    jsonb_build_object(
      'bib_number', v_registration.bib_number,
      'category_name', v_category.name,
      'elapsed_milliseconds', v_finish.elapsed_milliseconds
    ));

  return v_finish;
exception
  when unique_violation then raise exception 'This runner already has an official finish record.';
end;
$$;

revoke all on function public.record_run_finish(uuid) from public;
grant execute on function public.record_run_finish(uuid) to authenticated;

-- Update reset_run_timing to reset all categories in the event as well
create or replace function public.reset_run_timing(p_run_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finish_count integer;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;
  if not exists(select 1 from public.run_events where id = p_run_event_id) then
    raise exception 'Run event was not found.';
  end if;

  select count(*)::integer into v_finish_count
  from public.run_finish_records where run_event_id = p_run_event_id;

  delete from public.run_finish_records where run_event_id = p_run_event_id;

  update public.run_events
  set official_started_at = null, official_started_by = null, updated_at = now()
  where id = p_run_event_id;

  update public.run_categories
  set official_started_at = null, official_started_by = null
  where run_event_id = p_run_event_id;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'run_timing_reset', 'run_events', p_run_event_id::text,
    jsonb_build_object('deleted_finish_records', v_finish_count));

  return v_finish_count;
end;
$$;

revoke all on function public.reset_run_timing(uuid) from public;
grant execute on function public.reset_run_timing(uuid) to authenticated;

commit;
