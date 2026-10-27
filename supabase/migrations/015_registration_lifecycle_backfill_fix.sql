-- Fix the 014 lifecycle trigger so previously existing registrations can be backfilled.
-- Run manually in Supabase SQL Editor after 014_registration_documents_and_timeline.sql.

create or replace function public.set_run_registration_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  if tg_op = 'INSERT' then
    select lower(u.email) into v_email from auth.users u where u.id = new.user_id;
    new.registration_email := coalesce(nullif(lower(trim(new.registration_email)), ''), v_email);
  elsif old.registration_email is null then
    -- Permit the one-time backfill while continuing to preserve an existing snapshot.
    select lower(u.email) into v_email from auth.users u where u.id = new.user_id;
    new.registration_email := coalesce(nullif(lower(trim(new.registration_email)), ''), v_email);
  else
    new.registration_email := old.registration_email;
  end if;

  if new.status = 'approved' and (tg_op = 'INSERT' or old.approved_at is null) then
    -- Capture the first approval, including approved records created before 014.
    new.approved_at := coalesce(new.approved_at, new.reviewed_at, now());
  elsif tg_op = 'UPDATE' then
    new.approved_at := old.approved_at;
  end if;

  return new;
end;
$$;

update public.run_registrations r
set registration_email = lower(u.email)
from auth.users u
where u.id = r.user_id
  and r.registration_email is null;

update public.run_registrations
set approved_at = coalesce(reviewed_at, updated_at, created_at)
where status = 'approved'
  and approved_at is null;

-- Fail clearly if a registration references an account with no recoverable Auth email.
do $$
declare
  v_missing integer;
begin
  select count(*) into v_missing
  from public.run_registrations
  where registration_email is null;

  if v_missing > 0 then
    raise warning '% registration(s) still have no email because their Auth account has no available email.', v_missing;
  end if;
end;
$$;
