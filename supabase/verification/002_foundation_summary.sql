-- Sinoog 2027 consolidated Supabase foundation verification.
-- Run this after migrations 001-009. It returns one result table so the
-- Supabase SQL Editor can display every high-level check at the same time.

with
required_tables(name) as (values
  ('editions'), ('profiles'), ('user_roles'), ('site_settings'), ('activities'),
  ('posts'), ('media_assets'), ('post_media'), ('albums'), ('album_items'),
  ('sponsors'), ('edition_sponsors'), ('delegations'), ('delegation_memberships'),
  ('delegation_entries'), ('delegation_participants'), ('delegation_files'),
  ('run_events'), ('run_categories'), ('run_routes'), ('run_registrations'),
  ('registration_consents'), ('payments'), ('payment_evidence'), ('payment_events'),
  ('kit_claims'), ('audit_logs'), ('notification_outbox'), ('run_finish_records')
),
table_check as (
  select count(*) filter (where to_regclass('public.' || name) is not null) as found,
         count(*) as expected
  from required_tables
),
required_enums(name) as (values
  ('app_role'), ('content_status'), ('review_status'), ('payment_status')
),
enum_check as (
  select count(*) filter (where exists (
           select 1 from pg_type t
           join pg_namespace n on n.oid = t.typnamespace
           where n.nspname = 'public' and t.typname = re.name and t.typtype = 'e'
         )) as found,
         count(*) as expected
  from required_enums re
),
required_functions(name) as (values
  ('set_updated_at'), ('handle_new_user'), ('has_role'), ('can_manage_delegation'),
  ('submit_run_registration'), ('mark_gcash_payment_submitted'),
  ('review_run_registration'), ('start_run_timing'), ('record_run_finish'),
  ('get_my_run_result'), ('admin_register_cash_runner'),
  ('delete_rejected_run_registration'), ('reset_run_timing'),
  ('reorder_activity_for_date')
),
function_check as (
  select count(*) filter (where exists (
           select 1 from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = rf.name
         )) as found,
         count(*) as expected
  from required_functions rf
),
bucket_check as (
  select count(*) filter (
           where id in ('public-media', 'payment-evidence', 'delegation-files')
         ) as found,
         bool_and(case
           when id = 'public-media' then public
           when id in ('payment-evidence', 'delegation-files') then not public
           else true
         end) filter (
           where id in ('public-media', 'payment-evidence', 'delegation-files')
         ) as privacy_correct
  from storage.buckets
),
rls_check as (
  select count(*) filter (where c.relrowsecurity is true) as enabled,
         count(*) as expected
  from required_tables rt
  left join pg_class c on c.oid = to_regclass('public.' || rt.name)
),
admin_check as (
  select exists (
           select 1 from auth.users u
           where lower(u.email) = lower('rieldiango24@gmail.com')
         ) as user_exists,
         exists (
           select 1 from auth.users u
           join public.user_roles ur on ur.user_id = u.id
           where lower(u.email) = lower('rieldiango24@gmail.com')
             and ur.role = 'admin'
         ) as has_admin,
         exists (
           select 1 from auth.users u
           join public.user_roles ur on ur.user_id = u.id
           where lower(u.email) = lower('rieldiango24@gmail.com')
             and ur.role = 'public_user'
         ) as has_public_user
),
edition_check as (
  select count(*) as found,
         coalesce(bool_and(
           run_date = date '2027-01-09'
           and novena_start_date = date '2027-01-06'
           and fiesta_date = date '2027-01-15'
         ), false) as dates_correct,
         coalesce(bool_and(not registration_open), false) as registration_closed
  from public.editions
  where is_current = true
),
run_event_check as (
  select count(*) as found
  from public.run_events re
  join public.editions e on e.id = re.edition_id
  where e.is_current = true
),
trigger_check as (
  select exists (
           select 1 from pg_trigger
           where tgname = 'on_auth_user_created' and not tgisinternal
         ) as new_user_trigger,
         exists (
           select 1 from information_schema.triggers
           where event_object_schema = 'public'
             and trigger_name = 'set_updated_at'
         ) as updated_at_triggers
)
select 10 as sort_order, 'Required tables' as check_name,
       case when found = expected then 'PASS' else 'FAIL' end as status,
       found || ' of ' || expected || ' found' as detail
from table_check
union all
select 20, 'Required enums',
       case when found = expected then 'PASS' else 'FAIL' end,
       found || ' of ' || expected || ' found'
from enum_check
union all
select 30, 'Trusted functions',
       case when found = expected then 'PASS' else 'FAIL' end,
       found || ' of ' || expected || ' found'
from function_check
union all
select 40, 'Storage buckets',
       case when found = 3 then 'PASS' else 'FAIL' end,
       found || ' of 3 found'
from bucket_check
union all
select 50, 'Bucket privacy',
       case when found = 3 and privacy_correct is true then 'PASS' else 'FAIL' end,
       'public-media public; payment-evidence and delegation-files private'
from bucket_check
union all
select 60, 'RLS enabled',
       case when enabled = expected then 'PASS' else 'FAIL' end,
       enabled || ' of ' || expected || ' required tables'
from rls_check
union all
select 70, 'First administrator account',
       case when user_exists and has_admin and has_public_user then 'PASS' else 'FAIL' end,
       'user=' || user_exists || ', admin=' || has_admin || ', public_user=' || has_public_user
from admin_check
union all
select 80, 'One current edition',
       case when found = 1 then 'PASS' else 'FAIL' end,
       found || ' current edition row(s)'
from edition_check
union all
select 90, '2027 event dates',
       case when found = 1 and dates_correct then 'PASS' else 'FAIL' end,
       'Novena Jan 6; Run Jan 9; Fiesta Jan 15'
from edition_check
union all
select 100, 'Registration launch state',
       case when found = 1 and registration_closed then 'PASS' else 'FAIL' end,
       'Expected closed until committee launch approval'
from edition_check
union all
select 110, 'New-user profile trigger',
       case when new_user_trigger then 'PASS' else 'FAIL' end,
       'auth.users profile creation trigger'
from trigger_check
union all
select 120, 'updated_at triggers',
       case when updated_at_triggers then 'PASS' else 'FAIL' end,
       'At least one public set_updated_at trigger found'
from trigger_check
union all
select 130, 'Current run event',
       case when found = 1 then 'PASS' else 'FAIL' end,
       found || ' run event row(s) for the current edition'
from run_event_check
union all
select 140, 'CLI migration history', 'INFO',
       case
         when to_regclass('supabase_migrations.schema_migrations') is null
           then 'Unavailable: record SQL Editor runs manually in SUPABASE_VERIFICATION.md'
         else 'Available'
       end
order by sort_order;
