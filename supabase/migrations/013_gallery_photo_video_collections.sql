-- Sinoog 2027 gallery collections
-- Run once in the Supabase SQL Editor after migrations 001-012.
-- Note: Gallery collections use direct sorting (sort_order) instead of year grouping.

alter table public.albums
  add column if not exists media_type text;

update public.albums
set media_type = 'photo'
where media_type is null;

alter table public.albums
  alter column media_type set default 'photo',
  alter column media_type set not null;

alter table public.albums
  drop constraint if exists albums_media_type_check;

alter table public.albums
  add constraint albums_media_type_check check (media_type in ('photo', 'video'));

-- Ensure year is not required if the column exists in any environment
alter table public.albums
  drop constraint if exists albums_year_check;

do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'albums' and column_name = 'year'
  ) then
    alter table public.albums alter column year drop not null;
  end if;
end $$;

drop index if exists public.albums_gallery_public_idx;

create index if not exists albums_gallery_public_idx
  on public.albums(media_type, status, created_at desc);

comment on column public.albums.media_type is 'Gallery collection type: photo or video.';
