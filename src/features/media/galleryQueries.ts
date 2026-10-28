import { isLocalDemoMode, supabase } from '../../lib/supabase';
import type { ContentStatus, DbAlbum, DbAlbumItem, DbMediaAsset } from '../../types/database';
import { getPublicMediaUrl } from './mediaQueries';
import { compressGalleryImage } from './compressGalleryImage';

export type GalleryMediaType = 'photo' | 'video';

export interface GalleryAsset extends DbMediaAsset {
  publicUrl: string;
  youtubeId: string | null;
}

export interface GalleryAlbum extends DbAlbum {
  items: GalleryAsset[];
}

export interface GalleryAlbumInput {
  edition_id: string;
  title: string;
  description?: string | null;
  media_type: GalleryMediaType;
  status: ContentStatus;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'gallery-collection';
}

export function getYouTubeId(value: string): string | null {
  const trimmed = value.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const candidate = srcMatch?.[1] || trimmed;

  try {
    const url = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
      else id = url.pathname.match(/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/)?.[1] || '';
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
  }
}

export function normalizeYouTubeEmbed(value: string): string {
  const id = getYouTubeId(value);
  if (!id) {
    throw new Error('Paste a valid YouTube link or iframe embed code.');
  }
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function getYouTubeThumbnail(value: string): string {
  const id = getYouTubeId(value);
  // maxresdefault is true 16:9 (no letterbox bars). hqdefault is 4:3 with black bars.
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : '';
}

function mapAsset(asset: DbMediaAsset): GalleryAsset {
  const youtubeId = asset.kind === 'video' ? getYouTubeId(asset.object_path) : null;
  return {
    ...asset,
    publicUrl: asset.kind === 'image' ? getPublicMediaUrl(asset.object_path) : asset.object_path,
    youtubeId,
  };
}

async function hydrateAlbums(albumRows: DbAlbum[]): Promise<GalleryAlbum[]> {
  if (!supabase || albumRows.length === 0) {
    return albumRows.map((album) => ({ ...album, items: [] }));
  }

  const albumIds = albumRows.map((album) => album.id);
  const { data: itemData, error: itemError } = await supabase
    .from('album_items')
    .select('*')
    .in('album_id', albumIds)
    .order('sort_order', { ascending: true });
  if (itemError) throw new Error(itemError.message);

  const itemRows = (itemData || []) as DbAlbumItem[];
  const assetIds = [...new Set(itemRows.map((item) => item.media_id))];
  let assetRows: DbMediaAsset[] = [];
  if (assetIds.length > 0) {
    const { data: assetData, error: assetError } = await supabase
      .from('media_assets')
      .select('*')
      .in('id', assetIds);
    if (assetError) throw new Error(assetError.message);
    assetRows = (assetData || []) as DbMediaAsset[];
  }

  const assetMap = new Map(assetRows.map((asset) => [asset.id, mapAsset(asset)]));
  return albumRows
    .map((album) => ({
      ...album,
      items: itemRows
        .filter((item) => item.album_id === album.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => assetMap.get(item.media_id))
        .filter((asset): asset is GalleryAsset => Boolean(asset)),
    }))
    .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at));
}

export async function getPublishedGalleryAlbums(mediaType: GalleryMediaType): Promise<GalleryAlbum[]> {
  if (!supabase) {
    if (isLocalDemoMode) return [];
    throw new Error('The website database is not configured.');
  }
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('status', 'published')
    .eq('media_type', mediaType)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return hydrateAlbums((data || []) as DbAlbum[]);
}

export async function getGalleryAlbumsForAdmin(mediaType?: GalleryMediaType): Promise<GalleryAlbum[]> {
  if (!supabase) {
    if (isLocalDemoMode) return [];
    throw new Error('The website database is not configured.');
  }
  let query = supabase.from('albums').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (mediaType) query = query.eq('media_type', mediaType);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return hydrateAlbums((data || []) as DbAlbum[]);
}

export async function createGalleryAlbum(input: GalleryAlbumInput): Promise<DbAlbum> {
  if (!supabase) throw new Error('Supabase is not connected.');
  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;
  // A new collection goes to the end of its list; the committee can move it afterwards.
  const { data: last, error: lastError } = await supabase
    .from('albums')
    .select('sort_order')
    .eq('media_type', input.media_type)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (lastError) throw new Error(lastError.message);
  const sortOrder = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;
  const { data, error } = await supabase
    .from('albums')
    .insert({ ...input, slug, sort_order: sortOrder })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as DbAlbum;
}

export async function updateGalleryAlbum(
  albumId: string,
  input: Partial<Pick<DbAlbum, 'title' | 'description' | 'status'>>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not connected.');
  const { error } = await supabase.from('albums').update(input).eq('id', albumId);
  if (error) throw new Error(error.message);
  if (input.status) await syncAlbumAssetVisibility(albumId, input.status === 'published');
}

export async function reorderGalleryAlbum(albumId: string, position: number): Promise<void> {
  if (!supabase) throw new Error('Supabase is not connected.');
  const { error } = await supabase.rpc('reorder_gallery_album', {
    p_album_id: albumId,
    p_requested_position: Math.round(position),
  });
  if (error) throw new Error(error.message);
}

async function syncAlbumAssetVisibility(albumId: string, isPublic: boolean): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('album_items').select('media_id').eq('album_id', albumId);
  if (error) throw new Error(error.message);
  const ids = (data || []).map((row) => row.media_id);
  if (ids.length === 0) return;
  const { error: updateError } = await supabase.from('media_assets').update({ is_public: isPublic }).in('id', ids);
  if (updateError) throw new Error(updateError.message);
}

async function getAlbum(albumId: string): Promise<DbAlbum> {
  if (!supabase) throw new Error('Supabase is not connected.');
  const { data, error } = await supabase.from('albums').select('*').eq('id', albumId).single();
  if (error) throw new Error(error.message);
  return data as DbAlbum;
}

export async function uploadGalleryPhotos(
  albumId: string,
  files: File[],
): Promise<{ count: number; originalBytes: number; uploadedBytes: number }> {
  if (!supabase) throw new Error('Supabase is not connected.');
  if (files.length === 0) throw new Error('Choose at least one photo.');
  const album = await getAlbum(albumId);
  if (album.media_type !== 'photo') throw new Error('Photos can only be added to a photo collection.');

  const { data: existingData, error: existingError } = await supabase
    .from('album_items')
    .select('sort_order')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (existingError) throw new Error(existingError.message);
  let nextOrder = ((existingData?.[0]?.sort_order as number | undefined) || 0) + 1;
  const { data: authData } = await supabase.auth.getUser();
  let originalBytes = 0;
  let uploadedBytes = 0;
  let firstAssetId: string | null = null;

  for (const sourceFile of files) {
    const compressed = await compressGalleryImage(sourceFile);
    originalBytes += compressed.originalBytes;
    uploadedBytes += compressed.file.size;
    const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${nextOrder}`;
    const objectPath = `gallery/${albumId}/${unique}.webp`;
    const { error: uploadError } = await supabase.storage.from('public-media').upload(objectPath, compressed.file, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
    if (uploadError) throw new Error(`Could not upload “${sourceFile.name}”: ${uploadError.message}`);

    const { data: assetData, error: assetError } = await supabase
      .from('media_assets')
      .insert({
        edition_id: album.edition_id,
        bucket: 'public-media',
        object_path: objectPath,
        kind: 'image',
        title: sourceFile.name.replace(/\.[^.]+$/, ''),
        alt_text: `${album.title} photo`,
        caption: album.description,
        width: compressed.width,
        height: compressed.height,
        bytes: compressed.file.size,
        mime_type: 'image/webp',
        is_public: album.status === 'published',
        uploaded_by: authData.user?.id || null,
      })
      .select('*')
      .single();
    if (assetError || !assetData) {
      await supabase.storage.from('public-media').remove([objectPath]);
      throw new Error(assetError?.message || 'The photo record could not be created.');
    }

    const asset = assetData as DbMediaAsset;
    const { error: itemError } = await supabase.from('album_items').insert({
      album_id: albumId,
      media_id: asset.id,
      sort_order: nextOrder,
    });
    if (itemError) {
      await supabase.storage.from('public-media').remove([objectPath]);
      await supabase.from('media_assets').delete().eq('id', asset.id);
      throw new Error(itemError.message);
    }
    if (!firstAssetId) firstAssetId = asset.id;
    nextOrder += 1;
  }

  if (!album.cover_media_id && firstAssetId) {
    const { error } = await supabase.from('albums').update({ cover_media_id: firstAssetId }).eq('id', albumId);
    if (error) throw new Error(error.message);
  }
  return { count: files.length, originalBytes, uploadedBytes };
}

export async function addYouTubeVideo(
  albumId: string,
  input: { embedCode: string; title: string; description?: string },
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not connected.');
  const album = await getAlbum(albumId);
  if (album.media_type !== 'video') throw new Error('Videos can only be added to a video collection.');
  const embedUrl = normalizeYouTubeEmbed(input.embedCode);

  const { data: duplicate } = await supabase
    .from('media_assets')
    .select('id')
    .eq('bucket', 'youtube')
    .eq('object_path', embedUrl)
    .maybeSingle();
  if (duplicate) throw new Error('This YouTube video is already in the gallery.');

  const { data: existingData, error: existingError } = await supabase
    .from('album_items')
    .select('sort_order')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (existingError) throw new Error(existingError.message);
  const nextOrder = ((existingData?.[0]?.sort_order as number | undefined) || 0) + 1;
  const { data: authData } = await supabase.auth.getUser();
  const { data: assetData, error: assetError } = await supabase
    .from('media_assets')
    .insert({
      edition_id: album.edition_id,
      bucket: 'youtube',
      object_path: embedUrl,
      kind: 'video',
      title: input.title.trim() || album.title,
      alt_text: null,
      caption: input.description?.trim() || null,
      mime_type: 'text/html',
      is_public: album.status === 'published',
      uploaded_by: authData.user?.id || null,
    })
    .select('*')
    .single();
  if (assetError || !assetData) throw new Error(assetError?.message || 'The video record could not be created.');
  const asset = assetData as DbMediaAsset;
  const { error: itemError } = await supabase.from('album_items').insert({
    album_id: albumId,
    media_id: asset.id,
    sort_order: nextOrder,
  });
  if (itemError) {
    await supabase.from('media_assets').delete().eq('id', asset.id);
    throw new Error(itemError.message);
  }
  if (!album.cover_media_id) {
    const { error } = await supabase.from('albums').update({ cover_media_id: asset.id }).eq('id', albumId);
    if (error) throw new Error(error.message);
  }
}

async function removeOrphanAsset(asset: GalleryAsset): Promise<void> {
  if (!supabase) return;
  const { count, error } = await supabase
    .from('album_items')
    .select('*', { count: 'exact', head: true })
    .eq('media_id', asset.id);
  if (error) throw new Error(error.message);
  if ((count || 0) > 0) return;
  await supabase.from('albums').update({ cover_media_id: null }).eq('cover_media_id', asset.id);
  if (asset.bucket === 'public-media') {
    const { error: storageError } = await supabase.storage.from('public-media').remove([asset.object_path]);
    if (storageError) throw new Error(storageError.message);
  }
  const { error: assetError } = await supabase.from('media_assets').delete().eq('id', asset.id);
  if (assetError) throw new Error(assetError.message);
}

export async function deleteGalleryItem(albumId: string, asset: GalleryAsset): Promise<void> {
  if (!supabase) throw new Error('Supabase is not connected.');
  const { error } = await supabase
    .from('album_items')
    .delete()
    .eq('album_id', albumId)
    .eq('media_id', asset.id);
  if (error) throw new Error(error.message);

  const { data: album } = await supabase.from('albums').select('cover_media_id').eq('id', albumId).maybeSingle();
  if (album?.cover_media_id === asset.id) {
    const { data: nextItem } = await supabase
      .from('album_items')
      .select('media_id')
      .eq('album_id', albumId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    await supabase.from('albums').update({ cover_media_id: nextItem?.media_id || null }).eq('id', albumId);
  }
  await removeOrphanAsset(asset);
}

export async function deleteGalleryAlbum(album: GalleryAlbum): Promise<void> {
  if (!supabase) throw new Error('Supabase is not connected.');
  const { error } = await supabase.from('albums').delete().eq('id', album.id);
  if (error) throw new Error(error.message);
  for (const asset of album.items) await removeOrphanAsset(asset);
}