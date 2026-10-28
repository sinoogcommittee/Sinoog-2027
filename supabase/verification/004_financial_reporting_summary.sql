-- Run after 020_financial_reporting_dimensions.sql.
with checks as (
  select 10 as sort_order, 'Financial reporting columns' as check_name,
    case when count(*) = 3 then 'PASS' else 'FAIL' end as status,
    count(*)::text || ' of 3 found' as detail
  from information_schema.columns
  where table_schema = 'public' and table_name = 'financial_transactions'
    and column_name in ('counterparty_name', 'received_by_name', 'event_scope')

  union all
  select 20, 'Financial scope index',
    case when exists (
      select 1 from pg_indexes where schemaname = 'public'
        and tablename = 'financial_transactions'
        and indexname = 'financial_transactions_scope_date_idx'
    ) then 'PASS' else 'FAIL' end,
    'Supports scope and date reporting'

  union all
  select 30, 'Recorder enforcement trigger',
    case when exists (
      select 1 from pg_trigger where tgname = 'set_financial_transaction_actor' and not tgisinternal
    ) then 'PASS' else 'FAIL' end,
    'Database records the signed-in administrator'

  union all
  select 40, 'Creation audit trigger',
    case when exists (
      select 1 from pg_trigger where tgname = 'audit_financial_transaction_created' and not tgisinternal
    ) then 'PASS' else 'FAIL' end,
    'Every new ledger entry creates an audit record'

  union all
  select 50, 'Valid event scopes',
    case when count(*) filter (where event_scope not in ('general','festival','run')) = 0 then 'PASS' else 'FAIL' end,
    count(*)::text || ' financial row(s) checked'
  from public.financial_transactions
)
select * from checks order by sort_order;
