-- Sinoog 2027 core schema
-- Run this first in Supabase SQL Editor.
create extension if not exists pgcrypto;

create type public.app_role as enum ('public_user','delegation_head','news_in_charge','admin');
create type public.content_status as enum ('draft','published','archived');
create type public.review_status as enum ('draft','submitted','under_review','approved','needs_changes','rejected','cancelled');
create type public.payment_status as enum ('unpaid','submitted','verified','rejected','refunded');

create table public.editions (
  id uuid primary key default gen_random_uuid(), year int not null unique check (year between 2027 and 2100), name text not null,
  parish_name text not null, location text not null, timezone text not null default 'Asia/Manila',
  run_date date, novena_start_date date, fiesta_date date, registration_open boolean not null default false,
  is_current boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_current_edition on public.editions (is_current) where is_current;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, full_name text, mobile text, locality text,
  suspended_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade, role public.app_role not null,
  assigned_by uuid references public.profiles(id), assigned_at timestamptz not null default now(), primary key(user_id,role)
);
create table public.site_settings (
  edition_id uuid not null references public.editions(id) on delete cascade, key text not null, value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id), updated_at timestamptz not null default now(), primary key(edition_id,key)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.editions(id) on delete cascade,
  type text not null check (type in ('mass','run','festival','nightly','other')), title text not null,
  description text, starts_at timestamptz, ends_at timestamptz, venue text, celebrant text,
  status public.content_status not null default 'draft', sort_order int not null default 0,
  created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index activities_edition_time_idx on public.activities(edition_id,starts_at);

create table public.posts (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.editions(id) on delete cascade,
  slug text not null, title text not null, excerpt text, body_html text not null default '', category text not null default 'Announcement',
  featured_image_path text, status public.content_status not null default 'draft', pinned boolean not null default false,
  published_at timestamptz, created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(edition_id,slug)
);
create index posts_public_idx on public.posts(edition_id,status,published_at desc);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(), edition_id uuid references public.editions(id) on delete cascade,
  bucket text not null, object_path text not null, kind text not null check(kind in ('image','video','audio','document')),
  title text, alt_text text, caption text, credit text, width int, height int, bytes bigint, mime_type text,
  is_public boolean not null default false, uploaded_by uuid references public.profiles(id), created_at timestamptz not null default now(),
  unique(bucket,object_path)
);
create table public.post_media (
  post_id uuid not null references public.posts(id) on delete cascade, media_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order int not null default 0, primary key(post_id,media_id)
);
create table public.albums (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.editions(id) on delete cascade,
  title text not null, slug text not null, description text, status public.content_status not null default 'draft', cover_media_id uuid references public.media_assets(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(edition_id,slug)
);
create table public.album_items (
  album_id uuid not null references public.albums(id) on delete cascade, media_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order int not null default 0, primary key(album_id,media_id)
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(), name text not null, website_url text, logo_path text, created_at timestamptz not null default now()
);
create table public.edition_sponsors (
  edition_id uuid not null references public.editions(id) on delete cascade, sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  tier text not null default 'Supporter', sort_order int not null default 0, published boolean not null default false,
  primary key(edition_id,sponsor_id)
);

create table public.delegations (
  id uuid primary key default gen_random_uuid(), name text not null unique, locality text, created_at timestamptz not null default now()
);
create table public.delegation_memberships (
  delegation_id uuid not null references public.delegations(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  is_head boolean not null default true, assigned_by uuid references public.profiles(id), assigned_at timestamptz not null default now(),
  primary key(delegation_id,user_id)
);
create table public.delegation_entries (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.editions(id) on delete cascade,
  delegation_id uuid not null references public.delegations(id) on delete cascade, status public.review_status not null default 'draft',
  current_version int not null default 1, submitted_at timestamptz, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  reviewer_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(edition_id,delegation_id)
);
create table public.delegation_participants (
  id uuid primary key default gen_random_uuid(), entry_id uuid not null references public.delegation_entries(id) on delete cascade,
  full_name text not null, role_or_position text, birth_date date, version int not null default 1, created_at timestamptz not null default now()
);
create table public.delegation_files (
  id uuid primary key default gen_random_uuid(), entry_id uuid not null references public.delegation_entries(id) on delete cascade,
  kind text not null check(kind in ('music','roster','photo','document')), object_path text not null, original_name text not null,
  mime_type text, bytes bigint, version int not null default 1, uploaded_by uuid references public.profiles(id), created_at timestamptz not null default now()
);

create table public.run_events (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null unique references public.editions(id) on delete cascade,
  title text not null default 'Sinoog Run', registration_opens_at timestamptz, registration_closes_at timestamptz,
  terms_version text, terms_body text, privacy_version text, privacy_body text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.run_categories (
  id uuid primary key default gen_random_uuid(), run_event_id uuid not null references public.run_events(id) on delete cascade,
  name text not null, distance_meters int not null check(distance_meters > 0), fee_centavos int not null check(fee_centavos >= 0),
  capacity int check(capacity > 0), min_age int check(min_age >= 0), max_age int check(max_age >= min_age),
  kit_description text, published boolean not null default false, sort_order int not null default 0, unique(run_event_id,name)
);
create table public.run_routes (
  id uuid primary key default gen_random_uuid(), category_id uuid not null unique references public.run_categories(id) on delete cascade,
  map_image_path text, map_url text, route_notes text, published boolean not null default false, updated_at timestamptz not null default now()
);
create table public.run_registrations (
  id uuid primary key default gen_random_uuid(), reference text not null unique default ('SR-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  run_event_id uuid not null references public.run_events(id), category_id uuid not null references public.run_categories(id), user_id uuid not null references public.profiles(id),
  participant_name text not null, birth_date date, mobile text not null, locality text, shirt_size text, club_name text,
  emergency_name text not null, emergency_relationship text, emergency_mobile text not null, accessibility_notes text,
  fee_centavos int not null, currency text not null default 'PHP', status public.review_status not null default 'draft',
  submitted_at timestamptz, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, review_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(run_event_id,user_id)
);
create index registrations_review_idx on public.run_registrations(run_event_id,status,submitted_at);
create table public.registration_consents (
  id uuid primary key default gen_random_uuid(), registration_id uuid not null references public.run_registrations(id) on delete cascade,
  consent_type text not null check(consent_type in ('terms','privacy','guardian','marketing')), version text not null,
  accepted boolean not null, accepted_at timestamptz not null default now(), ip_hash text, unique(registration_id,consent_type,version)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), registration_id uuid not null references public.run_registrations(id) on delete cascade,
  method text not null, amount_centavos int not null check(amount_centavos >= 0), currency text not null default 'PHP',
  payer_reference text, status public.payment_status not null default 'unpaid', submitted_at timestamptz,
  verified_by uuid references public.profiles(id), verified_at timestamptz, rejection_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_evidence (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete cascade,
  object_path text not null, original_name text not null, mime_type text, bytes bigint, uploaded_at timestamptz not null default now()
);
create table public.payment_events (
  id uuid primary key default gen_random_uuid(), payment_id uuid references public.payments(id) on delete cascade,
  provider text not null, external_event_id text not null, event_type text not null, payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(), unique(provider,external_event_id)
);
create table public.kit_claims (
  registration_id uuid primary key references public.run_registrations(id) on delete cascade, bib_number text unique,
  claimed_at timestamptz not null default now(), claimed_by uuid not null references public.profiles(id), notes text
);

create table public.audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id), action text not null,
  entity_table text not null, entity_id text, detail jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), recipient text not null,
  template text not null, payload jsonb not null default '{}'::jsonb, status text not null default 'pending',
  attempts int not null default 0, last_error text, send_after timestamptz not null default now(), sent_at timestamptz, created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['editions','profiles','activities','posts','albums','delegation_entries','run_events','run_routes','run_registrations','payments'] loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t); end loop; end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); insert into public.user_roles(user_id,role) values(new.id,'public_user'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.editions(year,name,parish_name,location,timezone,run_date,novena_start_date,fiesta_date,is_current)
values(2027,'Sinoog 2027','Sto. Niño Parish - Guinacot','Guinacot, Guindulman, Bohol','Asia/Manila','2027-01-09','2027-01-09','2027-01-15',true)
on conflict(year) do nothing;
