import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Eye, Images, Pencil, Play, Plus, Trash2, Upload, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import {
  addYouTubeVideo,
  createGalleryAlbum,
  deleteGalleryAlbum,
  deleteGalleryItem,
  getGalleryAlbumsForAdmin,
  getYouTubeThumbnail,
  reorderGalleryAlbum,
  updateGalleryAlbum,
  uploadGalleryPhotos,
  type GalleryAlbum,
  type GalleryAsset,
  type GalleryMediaType,
} from '../../features/media/galleryQueries';
import { ConfirmDialog, EmptyState, LoadingState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import type { ContentStatus } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { TextArea } from '../../components/m3/TextArea';

interface AlbumFormState {
  title: string;
  description: string;
  status: ContentStatus;
}

const emptyAlbumForm: AlbumFormState = {
  title: '',
  description: '',
  status: 'draft',
};

type DeleteTarget = { type: 'album'; album: GalleryAlbum } | { type: 'item'; albumId: string; asset: GalleryAsset };

export function GalleryManagerPage() {
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [editionId, setEditionId] = useState('');
  const [mediaType, setMediaType] = useState<GalleryMediaType>('photo');
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
  const [manageAlbumId, setManageAlbumId] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState<AlbumFormState>(emptyAlbumForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoEmbed, setVideoEmbed] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [positionDrafts, setPositionDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async (type = mediaType) => {
    setLoading(true);
    try {
      const [edition, rows] = await Promise.all([getCurrentEdition(), getGalleryAlbumsForAdmin(type)]);
      setEditionId(edition.id);
      setAlbums(rows);
      setPositionDrafts({});
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to load gallery collections.', 'error');
    } finally {
      setLoading(false);
    }
  }, [mediaType, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(mediaType), 0);
    return () => window.clearTimeout(timer);
  }, [load, mediaType]);

  const managedAlbum = useMemo(
    () => albums.find((album) => album.id === manageAlbumId) || null,
    [albums, manageAlbumId],
  );

  const openCreate = () => {
    setEditingAlbum(null);
    setAlbumForm(emptyAlbumForm);
    setAlbumModalOpen(true);
  };

  const openEdit = (album: GalleryAlbum) => {
    setEditingAlbum(album);
    setAlbumForm({
      title: album.title,
      description: album.description || '',
      status: album.status,
    });
    setAlbumModalOpen(true);
  };

  const closeAlbumModal = () => {
    if (saving) return;
    setAlbumModalOpen(false);
    setEditingAlbum(null);
    setAlbumForm(emptyAlbumForm);
  };

  const handleSaveAlbum = async (event: FormEvent) => {
    event.preventDefault();
    if (!albumForm.title.trim()) {
      toast('Enter a collection title.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingAlbum) {
        await updateGalleryAlbum(editingAlbum.id, {
          title: albumForm.title.trim(),
          description: albumForm.description.trim() || null,
          status: albumForm.status,
        });
        toast('Gallery collection updated.', 'success');
      } else {
        await createGalleryAlbum({
          edition_id: editionId,
          title: albumForm.title.trim(),
          description: albumForm.description.trim() || null,
          media_type: mediaType,
          status: albumForm.status,
        });
        toast(`${mediaType === 'photo' ? 'Photo' : 'Video'} collection created at the end of the list.`, 'success');
      }
      closeAlbumModal();
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to save the collection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (album: GalleryAlbum) => {
    try {
      const nextStatus: ContentStatus = album.status === 'published' ? 'draft' : 'published';
      await updateGalleryAlbum(album.id, { status: nextStatus });
      toast(nextStatus === 'published' ? 'Collection published.' : 'Collection returned to draft.', 'success');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to change publication status.', 'error');
    }
  };

  const commitPosition = async (album: GalleryAlbum, currentPosition: number) => {
    const draft = positionDrafts[album.id];
    if (draft === undefined) return;
    const requested = Math.round(Number(draft));
    const clearDraft = () =>
      setPositionDrafts((current) => {
        const next = { ...current };
        delete next[album.id];
        return next;
      });
    if (!Number.isFinite(requested) || requested < 1) {
      clearDraft();
      toast('Enter a position of 1 or higher.', 'error');
      return;
    }
    const target = Math.min(requested, albums.length);
    if (target === currentPosition) {
      clearDraft();
      return;
    }
    setSaving(true);
    try {
      await reorderGalleryAlbum(album.id, target);
      toast(`“${album.title}” moved to position ${target}.`, 'success');
      await load();
    } catch (err: unknown) {
      clearDraft();
      toast(err instanceof Error ? err.message : 'Unable to change the order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!managedAlbum || photoFiles.length === 0) return;
    setSaving(true);
    try {
      const result = await uploadGalleryPhotos(managedAlbum.id, photoFiles);
      const savedPercent = result.originalBytes > 0
        ? Math.max(0, Math.round((1 - result.uploadedBytes / result.originalBytes) * 100))
        : 0;
      toast(`${result.count} photo${result.count === 1 ? '' : 's'} uploaded and compressed${savedPercent ? ` (${savedPercent}% smaller)` : ''}.`, 'success');
      setPhotoFiles([]);
      if (photoInputRef.current) photoInputRef.current.value = '';
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Photo upload failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVideo = async (event: FormEvent) => {
    event.preventDefault();
    if (!managedAlbum || !videoEmbed.trim()) return;
    setSaving(true);
    try {
      await addYouTubeVideo(managedAlbum.id, {
        embedCode: videoEmbed,
        title: videoTitle,
        description: videoDescription,
      });
      toast('YouTube video added.', 'success');
      setVideoTitle('');
      setVideoDescription('');
      setVideoEmbed('');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to add the video.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === 'album') {
        await deleteGalleryAlbum(deleteTarget.album);
        if (manageAlbumId === deleteTarget.album.id) setManageAlbumId(null);
        toast('Gallery collection and its media were deleted.', 'info');
      } else {
        await deleteGalleryItem(deleteTarget.albumId, deleteTarget.asset);
        toast('Gallery item deleted.', 'info');
      }
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to delete the gallery record.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page gallery-admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Gallery</p>
          <h1>Photo & video gallery</h1>
          <p>Create collections, add photos or YouTube videos, and choose the order they appear on the public gallery.</p>
        </div>
        <div className="gallery-admin-heading__actions" style={{ display: 'flex', gap: 'var(--md-space-2)', alignItems: 'center' }}>
          <Link to="/gallery" className="button button--ghost button--sm" style={{ textDecoration: 'none', minHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={15} /> Public gallery
          </Link>
          <Button variant="filled" size="small" leadingIcon={<Plus size={15} />} onClick={openCreate}>
            New collection
          </Button>
        </div>
      </div>

      <div className="gallery-admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--md-space-3)', marginBottom: 'var(--md-space-6)' }}>
        <div
          className="gallery-switcher admin-segmented-control"
          role="tablist"
          aria-label="Gallery management type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mediaType === 'photo'}
            className={mediaType === 'photo' ? 'active' : ''}
            onClick={() => setMediaType('photo')}
          >
            <Images size={17} /> Photos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mediaType === 'video'}
            className={mediaType === 'video' ? 'active' : ''}
            onClick={() => setMediaType('video')}
          >
            <Video size={17} /> Videos
          </button>
        </div>
        <p className="gallery-admin-toolbar__hint" style={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0, fontSize: '0.875rem' }}>
          {albums.length > 0
            ? `${albums.length} collection${albums.length === 1 ? '' : 's'}. Change a Position number to reorder the public gallery.`
            : 'No collections yet.'}
        </p>
      </div>

      {loading ? (
        <Card variant="outlined" style={{ padding: '3rem' }}>
          <LoadingState message="Loading gallery collections…" />
        </Card>
      ) : albums.length === 0 ? (
        <Card variant="outlined" style={{ padding: '3rem' }}>
          <EmptyState
            title={`No ${mediaType} collections yet`}
            message={`Create a ${mediaType} collection to start building the gallery.`}
            action={
              <Button variant="filled" size="small" leadingIcon={<Plus size={15} />} onClick={openCreate}>
                New collection
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="gallery-admin-grid">
          {albums.map((album, index) => {
            const preview = album.items[0];
            const previewSource = preview?.kind === 'video' ? getYouTubeThumbnail(preview.object_path) : preview?.publicUrl;
            const position = index + 1;
            return (
              <Card variant="outlined" className="gallery-admin-card" key={album.id}>
                <div className="gallery-admin-card__preview">
                  {previewSource ? <img src={previewSource} alt="" loading="lazy" /> : album.media_type === 'photo' ? <Images /> : <Video />}
                  {album.media_type === 'video' && previewSource && <span className="gallery-play-mark"><Play size={18} fill="currentColor" /></span>}
                  <span className="gallery-admin-card__order" title="Position in the public gallery">#{position}</span>
                  <span className="gallery-admin-card__status">
                    <StatusBadge tone={album.status === 'published' ? 'success' : album.status === 'draft' ? 'warning' : 'neutral'}>{album.status}</StatusBadge>
                  </span>
                </div>
                <div className="gallery-admin-card__body">
                  <h2>{album.title}</h2>
                  <p className="gallery-admin-card__meta">
                    {album.items.length} {album.media_type === 'photo' ? (album.items.length === 1 ? 'photo' : 'photos') : (album.items.length === 1 ? 'video' : 'videos')}
                  </p>
                  {album.description && <p className="gallery-admin-card__desc">{album.description}</p>}
                  <div className="gallery-admin-card__controls">
                    <label className="gallery-admin-card__position">
                      <span>Position</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={albums.length}
                        value={positionDrafts[album.id] ?? String(position)}
                        disabled={saving}
                        onChange={(event) => setPositionDrafts((current) => ({ ...current, [album.id]: event.target.value }))}
                        onBlur={() => void commitPosition(album, position)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                        aria-label={`Position of ${album.title}`}
                      />
                      <span>of {albums.length}</span>
                    </label>
                    <div className="gallery-admin-card__actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Button variant="tonal" size="small" leadingIcon={<Upload size={14} />} onClick={() => setManageAlbumId(album.id)}>
                        Manage media
                      </Button>
                      <Button variant="outlined" size="small" onClick={() => void handleTogglePublished(album)}>
                        {album.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <button
                        type="button"
                        className="button button--ghost button--sm gallery-admin-icon"
                        onClick={() => openEdit(album)}
                        aria-label={`Edit ${album.title}`}
                        title="Edit collection"
                        style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="button button--ghost button--sm gallery-admin-icon"
                        onClick={() => setDeleteTarget({ type: 'album', album })}
                        aria-label={`Delete ${album.title}`}
                        title="Delete collection"
                        style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Album create/edit dialog */}
      <Dialog
        open={albumModalOpen}
        onClose={closeAlbumModal}
        title={editingAlbum ? 'Edit collection' : 'Create collection'}
      >
        <p style={{ margin: '0 0 var(--md-space-4) 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
          {`Manage details and visibility for this ${mediaType} collection.`}
        </p>
        <form onSubmit={(event) => void handleSaveAlbum(event)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}>
          <TextField
            label="Collection title"
            required
            maxLength={140}
            value={albumForm.title}
            onChange={(event) => setAlbumForm((current) => ({ ...current, title: event.target.value }))}
          />
          <SelectField
            label="Publication status"
            value={albumForm.status}
            onChange={(event) => setAlbumForm((current) => ({ ...current, status: event.target.value as ContentStatus }))}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </SelectField>
          <TextArea
            label="Description"
            rows={3}
            placeholder="Describe this collection…"
            value={albumForm.description}
            onChange={(event) => setAlbumForm((current) => ({ ...current, description: event.target.value }))}
            helperText="Published collections appear in the public Gallery. Draft and archived stay hidden."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-2)' }}>
            <Button variant="text" onClick={closeAlbumModal}>
              Cancel
            </Button>
            <Button variant="filled" type="submit" loading={saving}>
              Save collection
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Media manager dialog */}
      <Dialog
        open={Boolean(managedAlbum)}
        onClose={() => setManageAlbumId(null)}
        title={managedAlbum?.title || 'Manage collection media'}
      >
        <p style={{ margin: '0 0 var(--md-space-4) 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
          {`${managedAlbum?.media_type === 'photo' ? 'Photo' : 'Video'} collection · ${managedAlbum?.status}`}
        </p>
        {managedAlbum && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-5)' }}>
            {managedAlbum.media_type === 'photo' ? (
              <Card variant="filled" style={{ padding: 'var(--md-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-space-2)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Upload photos</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Select as many JPG, PNG, or WebP photos as needed. Each image is compressed to WebP before it is stored.
                </p>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => setPhotoFiles(Array.from(event.target.files || []))}
                  style={{ marginTop: 'var(--md-space-2)' }}
                />
                {photoFiles.length > 0 && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>
                    {photoFiles.length} photo{photoFiles.length === 1 ? '' : 's'} selected
                  </span>
                )}
                <div style={{ marginTop: 'var(--md-space-2)' }}>
                  <Button
                    variant="filled"
                    disabled={saving || photoFiles.length === 0}
                    loading={saving}
                    leadingIcon={<Upload size={16} />}
                    onClick={() => void handlePhotoUpload()}
                  >
                    Compress & upload
                  </Button>
                </div>
              </Card>
            ) : (
              <form onSubmit={(event) => void handleAddVideo(event)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Add a YouTube video</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Paste a YouTube link or iframe embed code. The website keeps only the validated privacy-enhanced video URL.
                </p>
                <TextField
                  label="Video title"
                  required
                  placeholder="Example: Sinoog Festival highlights"
                  value={videoTitle}
                  onChange={(event) => setVideoTitle(event.target.value)}
                />
                <TextArea
                  label="YouTube link or embed code"
                  required
                  rows={3}
                  placeholder={'https://www.youtube.com/watch?v=... or <iframe src="..."></iframe>'}
                  value={videoEmbed}
                  onChange={(event) => setVideoEmbed(event.target.value)}
                />
                <TextArea
                  label="Description"
                  rows={2}
                  placeholder="Optional video description"
                  value={videoDescription}
                  onChange={(event) => setVideoDescription(event.target.value)}
                />
                <div>
                  <Button variant="filled" type="submit" loading={saving} disabled={saving || !videoEmbed.trim()} leadingIcon={<Plus size={16} />}>
                    Add video
                  </Button>
                </div>
              </form>
            )}

            <section className="gallery-media-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-space-3)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Collection media</h3>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>{managedAlbum.items.length} total</span>
              </div>
              {managedAlbum.items.length === 0 ? (
                <EmptyState
                  title="No media yet"
                  message={managedAlbum.media_type === 'photo' ? 'Upload the first photos for this collection.' : 'Add the first YouTube video for this collection.'}
                />
              ) : (
                <div className="gallery-media-grid">
                  {managedAlbum.items.map((asset, index) => {
                    const source = asset.kind === 'video' ? getYouTubeThumbnail(asset.object_path) : asset.publicUrl;
                    return (
                      <article key={asset.id} style={{ position: 'relative' }}>
                        <div>
                          {source ? <img src={source} alt={asset.alt_text || ''} loading="lazy" /> : <Images />}
                          {asset.kind === 'video' && <Play size={18} fill="currentColor" />}
                        </div>
                        <span>{index + 1}. {asset.title || (asset.kind === 'image' ? 'Photo' : 'Video')}</span>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'item', albumId: managedAlbum.id, asset })}
                          aria-label={`Delete ${asset.title || 'gallery item'}`}
                          title="Delete item"
                          style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'album' ? 'Delete this collection?' : 'Delete this gallery item?'}
        message={deleteTarget?.type === 'album'
          ? `“${deleteTarget.album.title}” and every photo or video in it will be permanently removed.`
          : 'This media item will be permanently removed from the collection and storage.'}
        confirmLabel={saving ? 'Deleting…' : 'Delete'}
        tone="danger"
        onCancel={() => !saving && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
