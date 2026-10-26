-- Registration lifecycle and race-clock controls.
-- Run manually in Supabase SQL Editor after migration 007.

begin;

drop policy if exists "admins delete payment evidence objects" on storage.objects;
create policy "admins delete payment evidence objects"
  on storage.objects for delete to authenticated
  using(bucket_id = 'payment-evidence' and public.has_role('admin'));

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
      select coalesce(max(bib_number::integer), 0) + 1 into v_next_bib
      from public.run_registrations
      where run_event_id = v_registration.run_event_id and bib_number ~ '^[0-9]{4}$';
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

create or replace function public.delete_rejected_run_registration(p_registration_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.run_registrations;
  v_paths text[];
begin
  select * into v_registration
  from public.run_registrations
  where id = p_registration_id
  for update;
  if not found then raise exception 'Registration was not found.'; end if;
  if v_registration.status <> 'rejected' then
    raise exception 'Only rejected registrations can be deleted.';
  end if;
  if not public.has_role('admin') and v_registration.user_id <> auth.uid() then
    raise exception 'You do not have permission to delete this registration.';
  end if;

  select coalesce(array_agg(e.object_path), array[]::text[])
  into v_paths
  from public.payment_evidence e
  join public.payments p on p.id = e.payment_id
  where p.registration_id = p_registration_id;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'rejected_run_registration_deleted', 'run_registrations', p_registration_id::text,
    jsonb_build_object('reference',v_registration.reference,'user_id',v_registration.user_id));

  delete from public.run_registrations where id = p_registration_id;
  return v_paths;
end;
$$;
revoke all on function public.delete_rejected_run_registration(uuid) from public;
grant execute on function public.delete_rejected_run_registration(uuid) to authenticated;

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

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'run_timing_reset', 'run_events', p_run_event_id::text,
    jsonb_build_object('deleted_finish_records',v_finish_count));
  return v_finish_count;
end;
$$;
revoke all on function public.reset_run_timing(uuid) from public;
grant execute on function public.reset_run_timing(uuid) to authenticated;

commit;
