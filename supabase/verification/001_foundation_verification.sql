-- NOTE: replace every ADMIN_EMAIL_HERE below with the administrator's sign-in email
-- before running. The real address is intentionally not stored in this public repository.
-- Sinoog 2027 read-only Supabase foundation verification.
-- Run in the Supabase SQL Editor after migrations 001-011.
-- Every row in the check sections should report `true` in the `present` column.

-- 1. Required public tables.
with expected(name) as (values
  ('editions'), ('profiles'), ('user_roles'), ('site_settings'), ('activities'),
  ('posts'), ('media_assets'), ('post_media'), ('albums'), ('album_items'),
  ('sponsors'), ('edition_sponsors'), ('delegations'), ('delegation_memberships'),
  ('delegation_entries'), ('delegation_participants'), ('delegation_files'),
  ('run_events'), ('run_categories'), ('run_routes'), ('run_registrations'),
  ('registration_consents'), ('payments'), ('payment_evidence'), ('payment_events'),
  ('kit_claims'), ('audit_logs'), ('notification_outbox'), ('run_finish_records'),
  ('financial_transactions')
)
select 'table' as object_type, expected.name,
       to_regclass('public.' || expected.name) is not null as present
from expected order by expected.name;

-- 2. Required enums.
with expected(name) as (values
  ('app_role'), ('content_status'), ('review_status'), ('payment_status')
)
select 'enum' as object_type, expected.name,
       exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
              where n.nspname='public' and t.typname=expected.name and t.typtype='e') as present
from expected order by expected.name;

-- 3. Required trusted/helper functions.
with expected(name) as (values
  ('set_updated_at'), ('handle_new_user'), ('has_role'), ('can_manage_delegation'),
  ('submit_run_registration'), ('mark_gcash_payment_submitted'),
  ('review_run_registration'), ('start_run_timing'), ('record_run_finish'),
  ('get_my_run_result'), ('admin_register_cash_runner'),
  ('delete_rejected_run_registration'), ('reset_run_timing'),
  ('reorder_activity_for_date'), ('mark_manual_payment_submitted'),
  ('list_cash_payment_receivers'), ('void_financial_transaction')
)
select 'function' as object_type, expected.name,
       exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname=expected.name) as present
from expected order by expected.name;

-- 4. Required Storage buckets and privacy settings.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('public-media','payment-evidence','delegation-files')
order by id;

-- Expected: public-media=true; payment-evidence=false; delegation-files=false.

-- 5. RLS must be enabled on every application table.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
order by c.relname;

-- 6. Policy inventory for manual role-matrix review.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

-- 7. Profile and updated_at trigger inventory.
select event_object_schema, event_object_table, trigger_name, event_manipulation
from information_schema.triggers
where (event_object_schema='public' and trigger_name='set_updated_at')
   or (event_object_schema='auth' and trigger_name='on_auth_user_created')
order by event_object_schema, event_object_table;

-- 8. First administrator verification.
select u.email, array_agg(ur.role order by ur.role) as roles
from auth.users u
left join public.user_roles ur on ur.user_id=u.id
where lower(u.email)=lower('ADMIN_EMAIL_HERE')
group by u.email;

-- Expected roles: admin and public_user.

-- 9. Current edition and key dates.
select id, name, is_current, run_date, novena_start_date, fiesta_date, registration_open
from public.editions
where is_current=true;

-- Expected: run_date=2027-01-09, novena_start_date=2027-01-06,
-- fiesta_date=2027-01-15, registration_open=false until launch approval.

-- 10. Run event configuration and official timing state.
select re.id, re.title, re.registration_opens_at, re.registration_closes_at,
       re.race_starts_at, re.gcash_number, re.official_started_at
from public.run_events re
join public.editions e on e.id=re.edition_id
where e.is_current=true;

-- 11. Index inventory for the main operational queues.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname='public'
  and tablename in ('activities','posts','run_registrations','run_finish_records','financial_transactions')
order by tablename, indexname;

-- 12. Migration history availability. Manual SQL Editor runs may not appear
-- in this table; record all manual runs in docs/SUPABASE_VERIFICATION.md.
select to_regclass('supabase_migrations.schema_migrations') is not null
       as cli_migration_history_available;
