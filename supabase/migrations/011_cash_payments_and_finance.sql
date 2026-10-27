-- Cash receiver attribution and administrator-only financial records.
-- Run manually in Supabase SQL Editor after migration 010.

begin;

alter table public.payments
  add column if not exists received_by uuid;

alter table public.payments
  drop constraint if exists payments_received_by_fkey;
alter table public.payments
  add constraint payments_received_by_fkey
  foreign key (received_by) references public.profiles(id) on delete set null;

create index if not exists payments_received_by_idx
  on public.payments(received_by, submitted_at desc);

-- Preserve the collecting administrator on historical walk-in cash payments.
update public.payments
set received_by = verified_by
where lower(method) = 'cash' and received_by is null and verified_by is not null;

create or replace function public.set_cash_payment_receiver()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if lower(new.method) = 'cash' and new.received_by is null and new.verified_by is not null then
    new.received_by := new.verified_by;
  end if;
  return new;
end;
$$;

drop trigger if exists set_cash_payment_receiver on public.payments;
create trigger set_cash_payment_receiver
before insert or update of method, received_by, verified_by on public.payments
for each row execute function public.set_cash_payment_receiver();

create or replace function public.list_cash_payment_receivers()
returns table(user_id uuid, full_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Sign in before selecting a cash receiver.'; end if;
  return query
  select p.id, coalesce(nullif(trim(p.full_name), ''), 'Sinoog administrator')
  from public.profiles p
  join public.user_roles r on r.user_id = p.id and r.role = 'admin'
  where p.suspended_at is null
  order by coalesce(nullif(trim(p.full_name), ''), 'Sinoog administrator');
end;
$$;
revoke all on function public.list_cash_payment_receivers() from public;
grant execute on function public.list_cash_payment_receivers() to authenticated;

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
begin
  if not exists(
    select 1 from public.payments p
    join public.run_registrations r on r.id = p.registration_id
    where p.id = p_payment_id and r.user_id = auth.uid()
  ) then raise exception 'Payment record was not found.'; end if;
  if not exists(select 1 from public.payment_evidence where payment_id = p_payment_id) then
    raise exception 'Upload proof of payment first.';
  end if;
  if v_method not in ('gcash', 'cash') then raise exception 'Select GCash or Cash.'; end if;
  if v_method = 'gcash' and nullif(trim(p_payer_reference), '') is null then
    raise exception 'Enter the GCash reference number.';
  end if;
  if v_method = 'cash' and not exists(
    select 1 from public.profiles p
    join public.user_roles r on r.user_id = p.id and r.role = 'admin'
    where p.id = p_received_by and p.suspended_at is null
  ) then raise exception 'Select the administrator who received the cash payment.'; end if;

  update public.payments
  set method = case when v_method = 'gcash' then 'GCash' else 'Cash' end,
      payer_reference = case when v_method = 'gcash' then trim(p_payer_reference) else null end,
      received_by = case when v_method = 'cash' then p_received_by else null end,
      status = 'submitted', submitted_at = now(), rejection_reason = null,
      updated_at = now()
  where id = p_payment_id;
end;
$$;
revoke all on function public.mark_manual_payment_submitted(uuid,text,text,uuid) from public;
grant execute on function public.mark_manual_payment_submitted(uuid,text,text,uuid) to authenticated;

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check(transaction_type in ('income','expense')),
  category text not null,
  description text not null,
  amount_centavos integer not null check(amount_centavos > 0),
  currency text not null default 'PHP',
  method text,
  reference text,
  transaction_date date not null default current_date,
  payment_id uuid references public.payments(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_transactions_date_idx
  on public.financial_transactions(transaction_date desc, created_at desc);
create index if not exists financial_transactions_type_idx
  on public.financial_transactions(transaction_type, category);

alter table public.financial_transactions enable row level security;
drop policy if exists "admins manage financial transactions" on public.financial_transactions;
drop policy if exists "admins read financial transactions" on public.financial_transactions;
drop policy if exists "admins create financial transactions" on public.financial_transactions;
create policy "admins read financial transactions"
  on public.financial_transactions for select to authenticated
  using(public.has_role('admin'));
create policy "admins create financial transactions"
  on public.financial_transactions for insert to authenticated
  with check(public.has_role('admin') and created_by = auth.uid());

drop trigger if exists set_updated_at on public.financial_transactions;
create trigger set_updated_at before update on public.financial_transactions
for each row execute function public.set_updated_at();

create or replace function public.void_financial_transaction(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then raise exception 'Administrator access required.'; end if;
  update public.financial_transactions
  set voided_at = now(), voided_by = auth.uid(), updated_at = now()
  where id = p_transaction_id and voided_at is null;
  if not found then raise exception 'The financial entry was not found or was already voided.'; end if;
  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(auth.uid(), 'financial_transaction_voided', 'financial_transactions', p_transaction_id::text, '{}'::jsonb);
end;
$$;
revoke all on function public.void_financial_transaction(uuid) from public;
grant execute on function public.void_financial_transaction(uuid) to authenticated;

-- New walk-in accounts receive the same profile details entered by the administrator.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, mobile, locality)
  values(
    new.id,
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'mobile'), ''),
    nullif(trim(new.raw_user_meta_data->>'locality'), '')
  );
  insert into public.user_roles(user_id, role) values(new.id, 'public_user');
  return new;
end;
$$;

commit;
