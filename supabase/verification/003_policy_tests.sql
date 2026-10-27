-- Sinoog 2027 access-control tests
--
-- Tries forbidden actions as a normal signed-in runner and as an anonymous visitor,
-- plus a few "control" actions that SHOULD work, then prints PASS / FAIL / REVIEW.
--
-- HOW TO RUN
--   * Prefer a TEST Supabase project. On production run it off-hours, after reading it.
--   * Paste the whole file into the Supabase SQL Editor and run it once.
--   * It creates two temporary fake users (policy-test-*@example.invalid) and a few
--     temporary rows, then deletes them at the end (database rows only). If a run is interrupted, simply
--     run it again: it cleans up leftovers first.
--
-- READING THE RESULT
--   PASS    the action was blocked (or the control worked) as expected.
--   FAIL    something that should be blocked succeeded, or a control failed. Fix before launch.
--   REVIEW  the action raised an error whose message is not an obvious access-control
--           message. Read the detail column: it may be a legitimate block, or an unrelated
--           error that hides a gap.
--   A "deny" test on a table that is empty proves nothing; the fixtures below make sure the
--   important tables contain rows.
--
--   The CONTROL tests need at least one published activity and one run event/category.
--   Supabase does not allow deleting rows from storage tables with SQL, so this script never
--   writes to storage on purpose. The one storage test is a 'deny' test: if it ever shows FAIL,
--   an object named like '<uuid>/policytest.webp' was created in the payment-evidence bucket;
--   delete it in Dashboard > Storage.
--
-- This script has not been executed by its author against your database. Read it first.

drop table if exists pg_temp.test_results;
drop table if exists pg_temp.tests;

-- 0. Clean leftovers from an interrupted earlier run
delete from auth.users
  where id in ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a002');

create temp table test_results (n serial, test text, result text, detail text);

-- 1. Fixtures: runner A (a001) and runner B (a002). The signup trigger creates their
--    profiles and the public_user role.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000a001', 'policy-test-runner@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000a002', 'policy-test-other@example.invalid',  'authenticated', 'authenticated');

do $$
declare
  ev uuid; cat uuid;
begin
  select e.id, c.id into ev, cat
  from public.run_events e
  join public.run_categories c on c.run_event_id = e.id
  order by e.created_at, c.sort_order
  limit 1;

  if ev is null then
    insert into pg_temp.test_results(test, result, detail)
    values ('fixture: run event and category', 'REVIEW',
            'No run_events/run_categories row found. Registration tests will show FAIL for lack of data.');
    return;
  end if;

  insert into public.run_registrations
    (run_event_id, category_id, user_id, participant_name, birth_date, mobile,
     emergency_name, emergency_mobile, fee_centavos, status)
  values
    (ev, cat, '00000000-0000-0000-0000-00000000a001', 'Policy Test Runner', '1995-01-01', '09000000000',
     'Test Contact', '09000000001', 0, 'draft'),
    (ev, cat, '00000000-0000-0000-0000-00000000a002', 'Policy Test Other', '1995-01-01', '09000000002',
     'Test Contact', '09000000003', 0, 'draft');

  -- Runner A is suspended so we can check they cannot lift their own suspension.
  update public.profiles set suspended_at = now()
  where id = '00000000-0000-0000-0000-00000000a001';
end $$;

-- 2. The tests. expect = 'deny' (must be blocked) or 'allow' (control: must work).
create temp table tests (n serial, name text, r text, sub text, q text, expect text);

insert into tests(name, r, sub, q, expect) values
('runner cannot insert a payment row (even "verified")', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ insert into public.payments(registration_id, method, amount_centavos, status)
     select id, 'cash', 0, 'verified' from public.run_registrations
     where user_id = '00000000-0000-0000-0000-00000000a001' $q$, 'deny'),

('runner cannot approve own registration', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ update public.run_registrations set status = 'approved'
     where user_id = '00000000-0000-0000-0000-00000000a001' $q$, 'deny'),

('runner cannot lift own suspension', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ update public.profiles set suspended_at = null
     where id = '00000000-0000-0000-0000-00000000a001' $q$, 'deny'),

('runner cannot edit another runner''s profile', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ update public.profiles set full_name = 'changed by test'
     where id = '00000000-0000-0000-0000-00000000a002' $q$, 'deny'),

('runner cannot grant themselves admin', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ insert into public.user_roles(user_id, role)
     values ('00000000-0000-0000-0000-00000000a001', 'admin') $q$, 'deny'),

('runner cannot read another runner''s registration', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ select 1 from public.run_registrations
     where user_id = '00000000-0000-0000-0000-00000000a002' $q$, 'deny'),

('runner cannot read audit logs', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ select 1 from public.audit_logs $q$, 'deny'),

('runner cannot read payment webhook events', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ select 1 from public.payment_events $q$, 'deny'),

('runner cannot upload into another runner''s evidence folder', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ insert into storage.objects(bucket_id, name)
     values ('payment-evidence', '00000000-0000-0000-0000-00000000a002/policytest.webp') $q$, 'deny'),

('anonymous cannot read draft activities', 'anon', null,
 $q$ select 1 from public.activities where status <> 'published' $q$, 'deny'),

('anonymous cannot read profiles', 'anon', null,
 $q$ select 1 from public.profiles $q$, 'deny'),

('anonymous cannot read run registrations', 'anon', null,
 $q$ select 1 from public.run_registrations $q$, 'deny'),

('anonymous cannot read payments', 'anon', null,
 $q$ select 1 from public.payments $q$, 'deny'),

-- Controls: these must work, otherwise the harness itself is not exercising the policies.
('CONTROL runner can read own registration', 'authenticated', '00000000-0000-0000-0000-00000000a001',
 $q$ select 1 from public.run_registrations
     where user_id = '00000000-0000-0000-0000-00000000a001' $q$, 'allow'),

('CONTROL anonymous can read published activities', 'anon', null,
 $q$ select 1 from public.activities where status = 'published' $q$, 'allow');

-- 3. Run them, each under the right role and identity.
do $$
declare
  t record; affected int; err text; res text; info text;
begin
  for t in select * from pg_temp.tests order by n loop
    affected := 0; err := null;

    perform set_config('request.jwt.claims',
      json_build_object('sub', t.sub, 'role', t.r)::text, true);
    perform set_config('request.jwt.claim.sub', coalesce(t.sub, ''), true);
    execute format('set local role %I', t.r);

    begin
      execute t.q;
      get diagnostics affected = row_count;
    exception when others then
      err := sqlerrm;
    end;

    reset role;

    if t.expect = 'deny' then
      if err is not null then
        res := case when err ~* 'row-level security|permission denied|administrator|not authori|not allowed|only admin'
                    then 'PASS' else 'REVIEW' end;
        info := 'blocked with error: ' || err;
      elsif affected = 0 then
        res := 'PASS'; info := 'blocked: 0 rows affected or visible';
      else
        res := 'FAIL'; info := 'NOT BLOCKED: ' || affected || ' row(s) affected or visible';
      end if;
    else
      if err is null and affected >= 1 then
        res := 'PASS'; info := 'worked as expected (' || affected || ' row(s))';
      else
        res := 'FAIL'; info := coalesce('error: ' || err, 'no rows returned');
      end if;
    end if;

    insert into pg_temp.test_results(test, result, detail) values (t.name, res, info);
  end loop;
end $$;

-- 4. Clean up fixtures (deleting the fake users cascades their profiles and registrations).
delete from auth.users
  where id in ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a002');

-- 5. Results
select test, result, detail from pg_temp.test_results order by n;