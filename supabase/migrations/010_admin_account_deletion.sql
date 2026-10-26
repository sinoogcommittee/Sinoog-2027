-- Controlled permanent account deletion.
-- Run manually in Supabase SQL Editor before deploying admin-manage-user.
-- Personal runner records cascade away with the profile. Official website and
-- race-operation records remain, but their deleted-user attribution is cleared.

begin;

alter table public.user_roles drop constraint if exists user_roles_assigned_by_fkey;
alter table public.user_roles add constraint user_roles_assigned_by_fkey foreign key (assigned_by) references public.profiles(id) on delete set null;
alter table public.site_settings drop constraint if exists site_settings_updated_by_fkey;
alter table public.site_settings add constraint site_settings_updated_by_fkey foreign key (updated_by) references public.profiles(id) on delete set null;
alter table public.activities drop constraint if exists activities_created_by_fkey;
alter table public.activities add constraint activities_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
alter table public.activities drop constraint if exists activities_updated_by_fkey;
alter table public.activities add constraint activities_updated_by_fkey foreign key (updated_by) references public.profiles(id) on delete set null;
alter table public.posts drop constraint if exists posts_created_by_fkey;
alter table public.posts add constraint posts_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
alter table public.posts drop constraint if exists posts_updated_by_fkey;
alter table public.posts add constraint posts_updated_by_fkey foreign key (updated_by) references public.profiles(id) on delete set null;
alter table public.media_assets drop constraint if exists media_assets_uploaded_by_fkey;
alter table public.media_assets add constraint media_assets_uploaded_by_fkey foreign key (uploaded_by) references public.profiles(id) on delete set null;
alter table public.delegation_memberships drop constraint if exists delegation_memberships_assigned_by_fkey;
alter table public.delegation_memberships add constraint delegation_memberships_assigned_by_fkey foreign key (assigned_by) references public.profiles(id) on delete set null;
alter table public.delegation_entries drop constraint if exists delegation_entries_reviewed_by_fkey;
alter table public.delegation_entries add constraint delegation_entries_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id) on delete set null;
alter table public.delegation_files drop constraint if exists delegation_files_uploaded_by_fkey;
alter table public.delegation_files add constraint delegation_files_uploaded_by_fkey foreign key (uploaded_by) references public.profiles(id) on delete set null;

alter table public.run_registrations drop constraint if exists run_registrations_user_id_fkey;
alter table public.run_registrations add constraint run_registrations_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.run_registrations drop constraint if exists run_registrations_reviewed_by_fkey;
alter table public.run_registrations add constraint run_registrations_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id) on delete set null;
alter table public.run_registrations drop constraint if exists run_registrations_registered_by_fkey;
alter table public.run_registrations add constraint run_registrations_registered_by_fkey foreign key (registered_by) references public.profiles(id) on delete set null;
alter table public.payments drop constraint if exists payments_verified_by_fkey;
alter table public.payments add constraint payments_verified_by_fkey foreign key (verified_by) references public.profiles(id) on delete set null;
alter table public.run_events drop constraint if exists run_events_official_started_by_fkey;
alter table public.run_events add constraint run_events_official_started_by_fkey foreign key (official_started_by) references public.profiles(id) on delete set null;

alter table public.kit_claims alter column claimed_by drop not null;
alter table public.kit_claims drop constraint if exists kit_claims_claimed_by_fkey;
alter table public.kit_claims add constraint kit_claims_claimed_by_fkey foreign key (claimed_by) references public.profiles(id) on delete set null;
alter table public.run_finish_records alter column recorded_by drop not null;
alter table public.run_finish_records drop constraint if exists run_finish_records_recorded_by_fkey;
alter table public.run_finish_records add constraint run_finish_records_recorded_by_fkey foreign key (recorded_by) references public.profiles(id) on delete set null;
alter table public.audit_logs drop constraint if exists audit_logs_actor_id_fkey;
alter table public.audit_logs add constraint audit_logs_actor_id_fkey foreign key (actor_id) references public.profiles(id) on delete set null;
alter table public.notification_outbox drop constraint if exists notification_outbox_user_id_fkey;
alter table public.notification_outbox add constraint notification_outbox_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

commit;
