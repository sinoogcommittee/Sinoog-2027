-- Atomic same-date activity ordering for concurrent committee editors.

begin;

create or replace function public.reorder_activity_for_date(
  p_activity_id uuid,
  p_requested_position integer,
  p_previous_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity public.activities;
  v_target_date date;
  v_position integer;
  v_ids uuid[];
  v_id uuid;
  v_index integer;
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required.';
  end if;

  select * into v_activity
  from public.activities
  where id = p_activity_id
  for update;

  if not found then raise exception 'Activity was not found.'; end if;
  if v_activity.starts_at is null then raise exception 'A start date is required before ordering an activity.'; end if;

  v_target_date := (v_activity.starts_at at time zone 'Asia/Manila')::date;
  perform pg_advisory_xact_lock(hashtextextended(v_activity.edition_id::text, 0));

  -- Lock both affected date groups before calculating their new positions.
  perform 1 from public.activities
  where edition_id = v_activity.edition_id
    and (
      (starts_at at time zone 'Asia/Manila')::date = v_target_date
      or (p_previous_date is not null and (starts_at at time zone 'Asia/Manila')::date = p_previous_date)
    )
  for update;

  select coalesce(array_agg(id order by sort_order, starts_at, id), array[]::uuid[])
  into v_ids
  from public.activities
  where edition_id = v_activity.edition_id
    and (starts_at at time zone 'Asia/Manila')::date = v_target_date
    and id <> p_activity_id;

  v_position := greatest(1, least(coalesce(p_requested_position, 1), cardinality(v_ids) + 1));
  v_ids := v_ids[1:v_position - 1] || array[p_activity_id] || v_ids[v_position:cardinality(v_ids)];

  v_index := 0;
  foreach v_id in array v_ids loop
    v_index := v_index + 1;
    update public.activities
    set sort_order = v_index, updated_at = now(), updated_by = auth.uid()
    where id = v_id and sort_order is distinct from v_index;
  end loop;

  if p_previous_date is not null and p_previous_date <> v_target_date then
    v_index := 0;
    for v_id in
      select id from public.activities
      where edition_id = v_activity.edition_id
        and (starts_at at time zone 'Asia/Manila')::date = p_previous_date
      order by sort_order, starts_at, id
    loop
      v_index := v_index + 1;
      update public.activities
      set sort_order = v_index, updated_at = now(), updated_by = auth.uid()
      where id = v_id and sort_order is distinct from v_index;
    end loop;
  end if;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(
    auth.uid(), 'activity_reordered', 'activities', p_activity_id::text,
    jsonb_build_object(
      'target_date', v_target_date,
      'previous_date', p_previous_date,
      'requested_position', p_requested_position,
      'applied_position', v_position
    )
  );
end;
$$;

revoke all on function public.reorder_activity_for_date(uuid,integer,date) from public;
grant execute on function public.reorder_activity_for_date(uuid,integer,date) to authenticated;

commit;
