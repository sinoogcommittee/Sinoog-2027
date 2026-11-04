-- 027_optional_gcash_reference.sql
-- Makes the GCash reference / transaction ID optional when submitting payment proof.
-- Runners can now directly open GCash, pay the category fee, and upload the screenshot
-- without being forced to manually type the reference number.

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

  -- GCash reference number is now OPTIONAL (verified primarily through uploaded screenshot).
  -- If provided, still validate reasonable character length bounds.
  if v_method = 'gcash' and v_reference is not null and (char_length(v_reference) < 4 or char_length(v_reference) > 100) then
    raise exception 'Enter a valid GCash reference number (at least 4 characters).';
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

-- Backward-compatible update for legacy mark_gcash_payment_submitted
create or replace function public.mark_gcash_payment_submitted(
  p_payment_id uuid,
  p_payer_reference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
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

  -- Optional reference validation if supplied
  if v_reference is not null and (char_length(v_reference) < 4 or char_length(v_reference) > 100) then
    raise exception 'Enter a valid GCash reference number (at least 4 characters).';
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
