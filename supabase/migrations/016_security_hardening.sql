-- 011: security hardening (already applied to the live project; kept here as the record).
-- Safe to run again.
begin;

-- Runners must not create payment rows directly; payments are created by the
-- submit_run_registration / mark_gcash_payment_submitted functions.
drop policy if exists "runners add own payments" on public.payments;

-- Only administrators may change suspension status.
create or replace function public.protect_profile_admin_fields()
returns trigger language plpgsql as $$
begin
  if new.suspended_at is distinct from old.suspended_at
     and auth.uid() is not null and not public.has_role('admin') then
    raise exception 'Only administrators can change suspension status.';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_admin_fields on public.profiles;
create trigger protect_profile_admin_fields
before update on public.profiles
for each row execute function public.protect_profile_admin_fields();

commit;
