-- Run after 014_registration_documents_and_timeline.sql.
with checks as (
  select 10 as sort_order, 'Registration lifecycle columns' as check_name,
    case when count(*) = 2 then 'PASS' else 'FAIL' end as status,
    count(*)::text || ' of 2 found' as detail
  from information_schema.columns
  where table_schema = 'public' and table_name = 'run_registrations'
    and column_name in ('registration_email', 'approved_at')

  union all
  select 20, 'Lifecycle trigger',
    case when exists (
      select 1 from pg_trigger
      where tgname = 'set_run_registration_lifecycle' and not tgisinternal
    ) then 'PASS' else 'FAIL' end,
    'Captures account email and first approval date'

  union all
  select 30, 'Current policy versions',
    case when count(*) > 0 and bool_and(terms_version = '2027-v2' and privacy_version = '2027-v2')
      then 'PASS' else 'FAIL' end,
    count(*)::text || ' current run event row(s) checked'
  from public.run_events
  where edition_id in (select id from public.editions where is_current)

  union all
  select 40, 'Existing registration emails',
    case when count(*) filter (where registration_email is null) = 0 then 'PASS' else 'FAIL' end,
    count(*) filter (where registration_email is null)::text || ' missing email snapshot(s)'
  from public.run_registrations

  union all
  select 50, 'Approved registration dates',
    case when count(*) filter (where status = 'approved' and approved_at is null) = 0 then 'PASS' else 'FAIL' end,
    count(*) filter (where status = 'approved' and approved_at is null)::text || ' approved row(s) missing approved_at'
  from public.run_registrations
)
select * from checks order by sort_order;
