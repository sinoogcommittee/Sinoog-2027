-- Expanded administrator financial ledger for cash inflows and expenses.
-- Run manually in Supabase SQL Editor after 019_gallery_collection_order.sql.

alter table public.financial_transactions
  add column if not exists counterparty_name text,
  add column if not exists received_by_name text,
  add column if not exists event_scope text not null default 'general';

alter table public.financial_transactions
  drop constraint if exists financial_transactions_event_scope_check;
alter table public.financial_transactions
  add constraint financial_transactions_event_scope_check
  check (event_scope in ('general', 'festival', 'run'));

comment on column public.financial_transactions.counterparty_name is
  'Received From for a cash inflow or Paid To for an expense.';
comment on column public.financial_transactions.received_by_name is
  'Person who physically received an expense payment, when different from Paid To.';
comment on column public.financial_transactions.event_scope is
  'Budget allocation: general, Sinoog Festival, or Sinoog Run.';

create index if not exists financial_transactions_scope_date_idx
  on public.financial_transactions(event_scope, transaction_date desc, created_at desc);

create or replace function public.set_financial_transaction_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role('admin') then
    raise exception 'Administrator access required.';
  end if;
  new.created_by := auth.uid();
  new.category := trim(new.category);
  new.description := trim(new.description);
  new.counterparty_name := nullif(trim(new.counterparty_name), '');
  new.received_by_name := nullif(trim(new.received_by_name), '');
  new.method := nullif(lower(trim(new.method)), '');
  new.reference := nullif(trim(new.reference), '');
  if new.transaction_type = 'income' then
    new.received_by_name := null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_financial_transaction_actor on public.financial_transactions;
create trigger set_financial_transaction_actor
before insert on public.financial_transactions
for each row execute function public.set_financial_transaction_actor();

create or replace function public.audit_financial_transaction_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
  values(
    new.created_by,
    'financial_transaction_created',
    'financial_transactions',
    new.id::text,
    jsonb_build_object(
      'transaction_type', new.transaction_type,
      'category', new.category,
      'event_scope', new.event_scope,
      'amount_centavos', new.amount_centavos,
      'method', new.method,
      'transaction_date', new.transaction_date
    )
  );
  return new;
end;
$$;

drop trigger if exists audit_financial_transaction_created on public.financial_transactions;
create trigger audit_financial_transaction_created
after insert on public.financial_transactions
for each row execute function public.audit_financial_transaction_created();

-- Existing entries remain valid and appear under General until an administrator
-- intentionally recreates/reclassifies them. Applied migrations are not rewritten.
