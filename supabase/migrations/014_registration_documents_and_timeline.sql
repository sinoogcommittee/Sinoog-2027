-- Sinoog 2027: finalized registration policy versions and durable lifecycle fields.
-- Run manually in Supabase SQL Editor after 013_gallery_photo_video_collections.sql.

alter table public.run_registrations
  add column if not exists registration_email text,
  add column if not exists approved_at timestamptz;

comment on column public.run_registrations.registration_email is
  'Account email used when the registration was submitted; retained as a registration snapshot.';
comment on column public.run_registrations.approved_at is
  'First date and time this registration entered approved status.';

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
  else
    -- The snapshot and first approval time are maintained by the database.
    new.registration_email := old.registration_email;
  end if;

  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    new.approved_at := coalesce(new.approved_at, now());
  elsif tg_op = 'UPDATE' then
    new.approved_at := old.approved_at;
  end if;

  return new;
end;
$$;

drop trigger if exists set_run_registration_lifecycle on public.run_registrations;
create trigger set_run_registration_lifecycle
before insert or update on public.run_registrations
for each row execute function public.set_run_registration_lifecycle();

update public.run_registrations r
set registration_email = lower(u.email)
from auth.users u
where u.id = r.user_id
  and r.registration_email is null;

update public.run_registrations
set approved_at = coalesce(reviewed_at, updated_at)
where status = 'approved'
  and approved_at is null;

create index if not exists run_registrations_registration_email_idx
  on public.run_registrations (lower(registration_email));

update public.run_events
set terms_version = '2027-v2',
    terms_body = 'I confirm that the submitted information is accurate, that I am fit for my selected category, and that I accept the ordinary risks of a public-road running event. I will follow route, safety, and medical instructions. I authorize reasonable emergency assistance. Registration fees are generally non-refundable after submission or approval, subject to the committee policy for duplicate payments, clear payment errors, or full event cancellation.',
    privacy_version = '2027-v2',
    privacy_body = 'The Sinoog Committee will use registration, contact, emergency, payment, consent, bib, QR, and timing information for event operations, safety, accounting, results, and audit. Private contact, emergency, payment-evidence, and QR-token data will not be published.'
where edition_id in (select id from public.editions where is_current);

-- Registration review remains intentionally combined with payment review.
-- review_run_registration already records the reviewer, date, notes and audit log,
-- verifies the submitted payment when approving, and assigns the bib/QR identifiers.
