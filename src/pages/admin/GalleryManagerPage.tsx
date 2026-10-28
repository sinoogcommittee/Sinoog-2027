import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Eye, Images, Pencil, Play, Plus, Trash2, Upload, Video, X } from 'lucide-react';
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
        <div className="gallery-admin-heading__actions">
          <Link to="/gallery" className="button button--ghost button--sm"><Eye size={15} /> Public gallery</Link>
          <button type="button" className="button button--primary button--sm" onClick={openCreate}><Plus size={15} /> New collection</button>
        </div>
      </div>

      <div className="gallery-admin-toolbar">
        <div className="gallery-switcher gallery-switcher--admin" aria-label="Gallery management type">
          <button type="button" className={mediaType === 'photo' ? 'active' : ''} onClick={() => setMediaType('photo')}><Images size={17} /> Photos</button>
          <button type="button" className={mediaType === 'video' ? 'active' : ''} onClick={() => setMediaType('video')}><Video size={17} /> Videos</button>
        </div>
        <p className="gallery-admin-toolbar__hint">
          {albums.length > 0
            ? `${albums.length} collection${albums.length === 1 ? '' : 's'}. Change a Position number to reorder the public gallery.`
            : 'No collections yet.'}
        </p>
      </div>

      {loading ? (
        <section className="admin-panel"><LoadingState message="Loading gallery collections…" /></section>
      ) : albums.length === 0 ? (
        <section className="admin-panel">
          <EmptyState
            title={`No ${mediaType} collections yet`}
            message={`Create a ${mediaType} collection to start building the gallery.`}
            action={<button type="button" className="button button--primary button--sm" onClick={openCreate}><Plus size={15} /> New collection</button>}
          />
        </section>
      ) : (
        <div className="gallery-admin-grid">
          {albums.map((album, index) => {
            const preview = album.items[0];
            const previewSource = preview?.kind === 'video' ? getYouTubeThumbnail(preview.object_path) : preview?.publicUrl;
            const position = index + 1;
            return (
              <article className="gallery-admin-card" key={album.id}>
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
                    <div className="gallery-admin-card__actions">
                      <button type="button" className="button button--primary button--sm" onClick={() => setManageAlbumId(album.id)}><Upload size={14} /> Manage media</button>
                      <button type="button" className="button button--secondary button--sm" onClick={() => void handleTogglePublished(album)}>{album.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                      <button type="button" className="button button--ghost button--sm gallery-admin-icon" onClick={() => openEdit(album)} aria-label={`Edit ${album.title}`} title="Edit collection"><Pencil size={15} /></button>
                      <button type="button" className="button button--ghost button--sm gallery-admin-icon" onClick={() => setDeleteTarget({ type: 'album', album })} aria-label={`Delete ${album.title}`} title="Delete collection"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {albumModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="gallery-album-form-title">
          <form className="modal-card gallery-admin-modal" onSubmit={(event) => void handleSaveAlbum(event)}>
            <div className="modal-title-row">
              <div><p className="eyebrow">{mediaType} collection</p><h2 id="gallery-album-form-title">{editingAlbum ? 'Edit collection' : 'Create collection'}</h2></div>
              <button type="button" className="icon-button" onClick={closeAlbumModal} aria-label="Close"><X /></button>
            </div>
            <label>Collection title<input value={albumForm.title} onChange={(event) => setAlbumForm((current) => ({ ...current, title: event.target.value }))} required maxLength={140} /></label>
            <label>Publication status<select value={albumForm.status} onChange={(event) => setAlbumForm((current) => ({ ...current, status: event.target.value as ContentStatus }))}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
            <label>Description<textarea rows={3} value={albumForm.description} onChange={(event) => setAlbumForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe this collection…" /></label>
            <p className="form-help">Published collections appear in the public Gallery. Draft and archived collections stay hidden. New collections are added at the end; change their Position on the list to move them.</p>
            <div className="modal-actions"><button type="button" className="button button--ghost" onClick={closeAlbumModal}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : 'Save collection'}</button></div>
          </form>
        </div>
      )}

      {managedAlbum && (
        <div className="modal-overlay gallery-media-overlay" role="dialog" aria-modal="true" aria-labelledby="gallery-media-title">
          <div className="modal-card gallery-media-modal">
            <div className="modal-title-row">
              <div><p className="eyebrow">{managedAlbum.media_type === 'photo' ? 'Photo' : 'Video'} collection · {managedAlbum.status}</p><h2 id="gallery-media-title">{managedAlbum.title}</h2></div>
              <button type="button" className="icon-button" onClick={() => setManageAlbumId(null)} aria-label="Close media manager"><X /></button>
            </div>

            {managedAlbum.media_type === 'photo' ? (
              <section className="gallery-upload-box">
                <h3>Upload photos</h3>
                <p>Select as many JPG, PNG, or WebP photos as needed. Each image is compressed to WebP before it is stored.</p>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setPhotoFiles(Array.from(event.target.files || []))} />
                {photoFiles.length > 0 && <span>{photoFiles.length} photo{photoFiles.length === 1 ? '' : 's'} selected</span>}
                <button type="button" className="button button--primary" disabled={saving || photoFiles.length === 0} onClick={() => void handlePhotoUpload()}><Upload size={16} /> {saving ? 'Uploading…' : 'Compress & upload'}</button>
              </section>
            ) : (
              <form className="gallery-upload-box" onSubmit={(event) => void handleAddVideo(event)}>
                <h3>Add a YouTube video</h3>
                <p>Paste a YouTube link or iframe embed code. The website keeps only the validated privacy-enhanced video URL.</p>
                <label>Video title<input value={videoTitle} onChange={(event) => setVideoTitle(event.target.value)} placeholder="Example: Sinoog Festival highlights" required /></label>
                <label>YouTube link or embed code<textarea rows={4} value={videoEmbed} onChange={(event) => setVideoEmbed(event.target.value)} placeholder={'<iframe src="https://www.youtube.com/embed/…"></iframe>'} required /></label>
                <label>Description<textarea rows={3} value={videoDescription} onChange={(event) => setVideoDescription(event.target.value)} placeholder="Optional video description" /></label>
                <button type="submit" className="button button--primary" disabled={saving || !videoEmbed.trim()}><Plus size={16} /> {saving ? 'Adding…' : 'Add video'}</button>
              </form>
            )}

            <section className="gallery-media-list">
              <div className="gallery-media-list__heading"><h3>Collection media</h3><span>{managedAlbum.items.length} total</span></div>
              {managedAlbum.items.length === 0 ? <EmptyState title="No media yet" message={managedAlbum.media_type === 'photo' ? 'Upload the first photos for this collection.' : 'Add the first YouTube video for this collection.'} /> : (
                <div className="gallery-media-grid">
                  {managedAlbum.items.map((asset, index) => {
                    const source = asset.kind === 'video' ? getYouTubeThumbnail(asset.object_path) : asset.publicUrl;
                    return (
                      <article key={asset.id}>
                        <div>{source ? <img src={source} alt={asset.alt_text || ''} loading="lazy" /> : <Images />}{asset.kind === 'video' && <Play size={18} fill="currentColor" />}</div>
                        <span>{index + 1}. {asset.title || (asset.kind === 'image' ? 'Photo' : 'Video')}</span>
                        <button type="button" onClick={() => setDeleteTarget({ type: 'item', albumId: managedAlbum.id, asset })} aria-label={`Delete ${asset.title || 'gallery item'}`} title="Delete item"><Trash2 size={15} /></button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

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