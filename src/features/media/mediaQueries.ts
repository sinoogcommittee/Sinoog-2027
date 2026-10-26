import { supabase } from '../../lib/supabase';
import type { MediaKind } from '../../types';

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadPublicMediaOptions {
  editionId?: string;
  folder?: string;
  title?: string;
  altText?: string;
  caption?: string;
  credit?: string;
}

export interface UploadResult {
  objectPath: string;
  publicUrl: string;
  mediaAssetId?: string;
}

export function getPublicMediaUrl(objectPath: string): string {
  if (!objectPath) return '';
  if (objectPath.startsWith('http://') || objectPath.startsWith('https://')) {
    return objectPath;
  }
  if (!supabase) {
    return objectPath;
  }
  const { data } = supabase.storage.from('public-media').getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function uploadPublicImage(
  file: File,
  options: UploadPublicMediaOptions = {}
): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Unsupported image format. Allowed formats: JPEG, PNG, WebP.');
  }

  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error('File exceeds the 10MB limit.');
  }

  if (!supabase) {
    // In demo/offline mode, return an object URL
    const demoUrl = URL.createObjectURL(file);
    return {
      objectPath: demoUrl,
      publicUrl: demoUrl,
    };
  }

  const folder = options.folder || 'posts';
  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
  const filename = `${folder}/${cleanBaseName}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('public-media')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const publicUrl = getPublicMediaUrl(filename);

  // Record in media_assets table
  try {
    const { data: assetData } = await supabase
      .from('media_assets')
      .insert({
        bucket: 'public-media',
        object_path: filename,
        kind: 'image' as MediaKind,
        title: options.title || file.name,
        alt_text: options.altText || null,
        caption: options.caption || null,
        credit: options.credit || null,
        bytes: file.size,
        mime_type: file.type,
        is_public: true,
      })
      .select('id')
      .single();

    return {
      objectPath: filename,
      publicUrl,
      mediaAssetId: assetData?.id,
    };
  } catch (err: unknown) {
    console.warn('Media asset row insert notice:', err);
    return {
      objectPath: filename,
      publicUrl,
    };
  }
}

