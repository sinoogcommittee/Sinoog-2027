-- 019: gallery collections are shown in an order chosen by the committee (1 = first).
-- Photo collections and video collections are numbered separately.
-- The display sequence is determined purely by sort_order. Safe to run again.
begin;

alter table public.albums add column if not exists sort_order integer;

-- Number the existing collections once, newest first, so the gallery looks the same as before.
update public.albums a
set sort_order = r.pos
from (
  select id, row_number() over (partition by media_type order by created_at desc, id) as pos
  from public.albums
) r
where r.id = a.id and a.sort_order is null;

alter table public.albums
  alter column sort_order set default 0,
  alter column sort_order set not null;

create index if not exists albums_gallery_order_idx
  on public.albums(media_type, status, sort_order, created_at desc);

comment on column public.albums.sort_order is 'Display position inside the public gallery for this media type (1 = first).';

-- Move one collection to a position and renumber the others, atomically.
create or replace function public.reorder_gallery_album(
  p_album_id uuid,
  p_requested_position integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_album public.albums;
  v_others uuid[];
  v_count integer;
  v_position integer;
  v_ordered uuid[];
begin
  if not (public.has_role('admin') or public.has_role('news_in_charge')) then
    raise exception 'Gallery editor access required.';
  end if;

  select * into v_album from public.albums where id = p_album_id;
  if not found then raise exception 'Collection was not found.'; end if;

  perform pg_advisory_xact_lock(hashtextextended('gallery-albums-' || v_album.media_type, 0));

  select coalesce(array_agg(id order by sort_order, created_at desc, id), '{}'::uuid[])
  into v_others
  from public.albums
  where media_type = v_album.media_type and id <> p_album_id;

  v_count := coalesce(array_length(v_others, 1), 0) + 1;
  v_position := least(greatest(coalesce(p_requested_position, 1), 1), v_count);

  v_ordered := v_others[1:v_position - 1] || array[p_album_id] || v_others[v_position:v_count - 1];

  update public.albums a
  set sort_order = o.ord::integer, updated_at = now()
  from unnest(v_ordered) with ordinality as o(id, ord)
  where a.id = o.id;
end;
$$;

revoke all on function public.reorder_gallery_album(uuid, integer) from public;
grant execute on function public.reorder_gallery_album(uuid, integer) to authenticated;

commit;