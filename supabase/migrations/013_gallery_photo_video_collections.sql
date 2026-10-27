-- Sinoog 2027 gallery collections
-- Run once in the Supabase SQL Editor after migrations 001-012.

alter table public.albums
  add column if not exists year integer;

alter table public.albums
  add column if not exists media_type text;

update public.albums a
set year = coalesce(e.year, 2027)
from public.editions e
where e.id = a.edition_id
  and a.year is null;

update public.albums
set media_type = 'photo'
where media_type is null;

alter table public.albums
  alter column year set default 2027,
  alter column year set not null,
  alter column media_type set default 'photo',
  alter column media_type set not null;

alter table public.albums
  drop constraint if exists albums_year_check;

alter table public.albums
  add constraint albums_year_check check (year between 1900 and 2100);

alter table public.albums
  drop constraint if exists albums_media_type_check;

alter table public.albums
  add constraint albums_media_type_check check (media_type in ('photo', 'video'));

create index if not exists albums_gallery_public_idx
  on public.albums(media_type, status, year desc, created_at desc);

comment on column public.albums.year is 'Celebration year used for current and previous gallery filtering.';
comment on column public.albums.media_type is 'Gallery collection type: photo or video.';
