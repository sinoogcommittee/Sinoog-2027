-- Sinoog 2027 access control and storage
-- Run after 001_schema.sql. Test policies before opening registration.
create or replace function public.has_role(required_role public.app_role)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=auth.uid() and role=required_role)
  and not exists(select 1 from public.profiles where id=auth.uid() and suspended_at is not null)
$$;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated;

create or replace function public.can_manage_delegation(target_delegation uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.has_role('admin') or exists(
    select 1 from public.delegation_memberships m where m.user_id=auth.uid() and m.delegation_id=target_delegation and m.is_head
  )
$$;
revoke all on function public.can_manage_delegation(uuid) from public;
grant execute on function public.can_manage_delegation(uuid) to authenticated;

alter table public.editions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.site_settings enable row level security;
alter table public.activities enable row level security;
alter table public.posts enable row level security;
alter table public.media_assets enable row level security;
alter table public.post_media enable row level security;
alter table public.albums enable row level security;
alter table public.album_items enable row level security;
alter table public.sponsors enable row level security;
alter table public.edition_sponsors enable row level security;
alter table public.delegations enable row level security;
alter table public.delegation_memberships enable row level security;
alter table public.delegation_entries enable row level security;
alter table public.delegation_participants enable row level security;
alter table public.delegation_files enable row level security;
alter table public.run_events enable row level security;
alter table public.run_categories enable row level security;
alter table public.run_routes enable row level security;
alter table public.run_registrations enable row level security;
alter table public.registration_consents enable row level security;
alter table public.payments enable row level security;
alter table public.payment_evidence enable row level security;
alter table public.payment_events enable row level security;
alter table public.kit_claims enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_outbox enable row level security;

create policy "public reads editions" on public.editions for select using(true);
create policy "admins manage editions" on public.editions for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "users read own profile" on public.profiles for select to authenticated using(id=auth.uid() or public.has_role('admin'));
create policy "users update own profile" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "admins manage profiles" on public.profiles for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "users see own roles" on public.user_roles for select to authenticated using(user_id=auth.uid() or public.has_role('admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "public reads site settings" on public.site_settings for select using(true);
create policy "admins manage settings" on public.site_settings for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));

create policy "public reads published activities" on public.activities for select using(status='published');
create policy "admins manage activities" on public.activities for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "public reads published posts" on public.posts for select using(status='published' and (published_at is null or published_at<=now()));
create policy "editors manage posts" on public.posts for all to authenticated using(public.has_role('admin') or public.has_role('news_in_charge')) with check(public.has_role('admin') or public.has_role('news_in_charge'));
create policy "public reads public media" on public.media_assets for select using(is_public);
create policy "editors manage media" on public.media_assets for all to authenticated using(public.has_role('admin') or public.has_role('news_in_charge')) with check(public.has_role('admin') or public.has_role('news_in_charge'));
create policy "public reads post media" on public.post_media for select using(exists(select 1 from public.posts p where p.id=post_id and p.status='published'));
create policy "editors manage post media" on public.post_media for all to authenticated using(public.has_role('admin') or public.has_role('news_in_charge')) with check(public.has_role('admin') or public.has_role('news_in_charge'));
create policy "public reads published albums" on public.albums for select using(status='published');
create policy "editors manage albums" on public.albums for all to authenticated using(public.has_role('admin') or public.has_role('news_in_charge')) with check(public.has_role('admin') or public.has_role('news_in_charge'));
create policy "public reads published album items" on public.album_items for select using(exists(select 1 from public.albums a where a.id=album_id and a.status='published'));
create policy "editors manage album items" on public.album_items for all to authenticated using(public.has_role('admin') or public.has_role('news_in_charge')) with check(public.has_role('admin') or public.has_role('news_in_charge'));
create policy "public reads sponsors" on public.sponsors for select using(true);
create policy "admins manage sponsors" on public.sponsors for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "public reads published edition sponsors" on public.edition_sponsors for select using(published);
create policy "admins manage edition sponsors" on public.edition_sponsors for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));

create policy "public reads delegations" on public.delegations for select using(true);
create policy "admins manage delegations" on public.delegations for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "memberships visible to owner or admin" on public.delegation_memberships for select to authenticated using(user_id=auth.uid() or public.has_role('admin'));
create policy "admins manage memberships" on public.delegation_memberships for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "delegation heads manage entries" on public.delegation_entries for all to authenticated using(public.can_manage_delegation(delegation_id)) with check(public.can_manage_delegation(delegation_id));
create policy "delegation heads manage participants" on public.delegation_participants for all to authenticated using(exists(select 1 from public.delegation_entries e where e.id=entry_id and public.can_manage_delegation(e.delegation_id))) with check(exists(select 1 from public.delegation_entries e where e.id=entry_id and public.can_manage_delegation(e.delegation_id)));
create policy "delegation heads manage file rows" on public.delegation_files for all to authenticated using(exists(select 1 from public.delegation_entries e where e.id=entry_id and public.can_manage_delegation(e.delegation_id))) with check(exists(select 1 from public.delegation_entries e where e.id=entry_id and public.can_manage_delegation(e.delegation_id)));

create policy "public reads run event" on public.run_events for select using(true);
create policy "admins manage run event" on public.run_events for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "public reads published categories" on public.run_categories for select using(published);
create policy "admins manage categories" on public.run_categories for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "public reads published routes" on public.run_routes for select using(published);
create policy "admins manage routes" on public.run_routes for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "runners manage own registration" on public.run_registrations for all to authenticated using(user_id=auth.uid() or public.has_role('admin')) with check(user_id=auth.uid() or public.has_role('admin'));
create policy "runners read own consents" on public.registration_consents for select to authenticated using(exists(select 1 from public.run_registrations r where r.id=registration_id and (r.user_id=auth.uid() or public.has_role('admin'))));
create policy "runners add own consents" on public.registration_consents for insert to authenticated with check(exists(select 1 from public.run_registrations r where r.id=registration_id and r.user_id=auth.uid()));
create policy "runners read own payments" on public.payments for select to authenticated using(exists(select 1 from public.run_registrations r where r.id=registration_id and (r.user_id=auth.uid() or public.has_role('admin'))));
create policy "runners add own payments" on public.payments for insert to authenticated with check(exists(select 1 from public.run_registrations r where r.id=registration_id and r.user_id=auth.uid()));
create policy "admins update payments" on public.payments for update to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "runners read own payment evidence" on public.payment_evidence for select to authenticated using(exists(select 1 from public.payments p join public.run_registrations r on r.id=p.registration_id where p.id=payment_id and (r.user_id=auth.uid() or public.has_role('admin'))));
create policy "runners add own payment evidence" on public.payment_evidence for insert to authenticated with check(exists(select 1 from public.payments p join public.run_registrations r on r.id=p.registration_id where p.id=payment_id and r.user_id=auth.uid()));
create policy "admins read payment events" on public.payment_events for select to authenticated using(public.has_role('admin'));
create policy "runner reads own kit claim" on public.kit_claims for select to authenticated using(exists(select 1 from public.run_registrations r where r.id=registration_id and (r.user_id=auth.uid() or public.has_role('admin'))));
create policy "admins manage kit claims" on public.kit_claims for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "admins read audit logs" on public.audit_logs for select to authenticated using(public.has_role('admin'));
create policy "admins read outbox" on public.notification_outbox for select to authenticated using(public.has_role('admin'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('public-media','public-media',true,10485760,array['image/jpeg','image/png','image/webp','video/mp4']),
('payment-evidence','payment-evidence',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf']),
('delegation-files','delegation-files',false,26214400,array['audio/mpeg','audio/wav','audio/mp4','application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "public views published media objects" on storage.objects for select using(bucket_id='public-media');
create policy "editors upload public media" on storage.objects for insert to authenticated with check(bucket_id='public-media' and (public.has_role('admin') or public.has_role('news_in_charge')));
create policy "editors update public media" on storage.objects for update to authenticated using(bucket_id='public-media' and (public.has_role('admin') or public.has_role('news_in_charge')));
create policy "editors delete public media" on storage.objects for delete to authenticated using(bucket_id='public-media' and (public.has_role('admin') or public.has_role('news_in_charge')));
create policy "runners access own evidence objects" on storage.objects for select to authenticated using(bucket_id='payment-evidence' and ((storage.foldername(name))[1]=auth.uid()::text or public.has_role('admin')));
create policy "runners upload own evidence objects" on storage.objects for insert to authenticated with check(bucket_id='payment-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "runners replace own evidence objects" on storage.objects for update to authenticated using(bucket_id='payment-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "delegation members access files" on storage.objects for select to authenticated using(bucket_id='delegation-files' and (public.has_role('admin') or public.can_manage_delegation(((storage.foldername(name))[1])::uuid)));
create policy "delegation heads upload files" on storage.objects for insert to authenticated with check(bucket_id='delegation-files' and public.can_manage_delegation(((storage.foldername(name))[1])::uuid));
create policy "delegation heads update files" on storage.objects for update to authenticated using(bucket_id='delegation-files' and public.can_manage_delegation(((storage.foldername(name))[1])::uuid));

-- After creating your first Auth user, promote it once from SQL Editor:
-- insert into public.user_roles(user_id,role) values ('AUTH-USER-UUID','admin') on conflict do nothing;
