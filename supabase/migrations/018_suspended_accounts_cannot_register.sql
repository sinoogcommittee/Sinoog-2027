-- 018: a suspended account cannot start a registration or submit a payment.
-- Until now suspension only blocked staff and admin checks; a suspended runner could still
-- register and submit payments. Safe to run again.
begin;

create or replace function public.block_suspended_runner_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.user_id = auth.uid()
     and exists(select 1 from public.profiles where id = auth.uid() and suspended_at is not null) then
    raise exception 'This account is suspended and cannot register.';
  end if;
  return new;
end;
$$;

drop trigger if exists block_suspended_runner_registration on public.run_registrations;
create trigger block_suspended_runner_registration
before insert on public.run_registrations
for each row execute function public.block_suspended_runner_registration();

create or replace function public.block_suspended_runner_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid;
begin
  if auth.uid() is null then return new; end if;
  select user_id into v_owner from public.run_registrations where id = new.registration_id;
  if v_owner = auth.uid()
     and exists(select 1 from public.profiles where id = auth.uid() and suspended_at is not null) then
    raise exception 'This account is suspended and cannot submit payments.';
  end if;
  return new;
end;
$$;

drop trigger if exists block_suspended_runner_payment on public.payments;
create trigger block_suspended_runner_payment
before update on public.payments
for each row when (new.status = 'submitted')
execute function public.block_suspended_runner_payment();

commit;