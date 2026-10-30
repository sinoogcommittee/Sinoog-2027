-- Migration 021: Delegation Workspace Schema Enhancements, Public Showcase Policies & Storage Deletion
-- Enables themes, choreographic synopsis, public read of approved contingents, and file deletion by delegation heads/admins.

-- 1. Add theme and description to delegation_entries
alter table public.delegation_entries
  add column if not exists theme text,
  add column if not exists description text;

-- 2. Public RLS policy for viewing approved delegation entries on the festival showcase (/festival)
drop policy if exists "public reads approved delegation entries" on public.delegation_entries;
create policy "public reads approved delegation entries"
  on public.delegation_entries
  for select
  using (status = 'approved');

-- 3. Public RLS policy for viewing approved delegation participants on the festival showcase
drop policy if exists "public reads approved delegation participants" on public.delegation_participants;
create policy "public reads approved delegation participants"
  on public.delegation_participants
  for select
  using (
    exists (
      select 1 from public.delegation_entries e
      where e.id = entry_id and e.status = 'approved'
    )
  );

-- 4. Storage deletion policy for delegation-files bucket
-- Allows delegation heads and administrators to delete/replace uploaded audio or roster documents
drop policy if exists "delegation heads and admins delete files" on storage.objects;
create policy "delegation heads and admins delete files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'delegation-files' and (
      public.has_role('admin') or
      public.can_manage_delegation(((storage.foldername(name))[1])::uuid)
    )
  );

-- 5. Helper indexes for querying delegations, entries, rosters, and memberships
create index if not exists idx_delegation_entries_delegation on public.delegation_entries(delegation_id);
create index if not exists idx_delegation_entries_status on public.delegation_entries(status);
create index if not exists idx_delegation_participants_entry on public.delegation_participants(entry_id);
create index if not exists idx_delegation_files_entry on public.delegation_files(entry_id);
create index if not exists idx_delegation_memberships_user on public.delegation_memberships(user_id);