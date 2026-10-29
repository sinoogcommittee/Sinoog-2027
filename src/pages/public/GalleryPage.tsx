import { useCallback, useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Images, Play, Video, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { PageHero } from '../../components/PageHero';
import { Card } from '../../components/m3/Card';
import {
  getPublishedGalleryAlbums,
  getYouTubeThumbnail,
  type GalleryAlbum,
  type GalleryAsset,
  type GalleryMediaType,
} from '../../features/media/galleryQueries';
import { EmptyState, ErrorState, LoadingState } from '../../features/ui/FeedbackStates';

function GalleryPreview({ asset, title }: { asset: GalleryAsset; title: string }) {
  const source = asset.kind === 'video' ? getYouTubeThumbnail(asset.object_path) : asset.publicUrl;
  return (
    <div className="gallery-collection-card__image">
      {source ? (
        <img
          src={source}
          alt={asset.kind === 'image' ? asset.alt_text || title : ''}
          loading="lazy"
          onError={(event) => {
            const img = event.currentTarget;
            const idMatch = img.src.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
            if (!idMatch) return;
            const id = idMatch[1];
            if (img.src.includes('maxresdefault')) {
              img.src = `https://i.ytimg.com/vi/${id}/hq720.jpg`;
            } else if (img.src.includes('hq720')) {
              img.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
            }
          }}
        />
      ) : (
        <Camera aria-hidden="true" />
      )}
      {asset.kind === 'video' && (
        <span className="gallery-play-mark">
          <Play size={18} fill="currentColor" />
        </span>
      )}
    </div>
  );
}

function AlbumCard({ album, onOpen }: { album: GalleryAlbum; onOpen: () => void }) {
  const previewItems = album.items.slice(0, 5);
  const remaining = Math.max(0, album.items.length - 5);
  const isPhoto = album.media_type === 'photo';
  const countLabel =
    album.items.length === 1
      ? isPhoto
        ? '1 photo'
        : '1 video'
      : isPhoto
        ? `${album.items.length} photos`
        : `${album.items.length} videos`;

  return (
    <Card
      as="article"
      variant="outlined"
      className={`gallery-collection-card${album.media_type === 'video' ? ' gallery-collection-card--video' : ''}`}
    >
      <button
        type="button"
        className={`gallery-collage gallery-collage--${Math.min(previewItems.length, 5)}${
          album.media_type === 'video' ? ' gallery-collage--video' : ''
        }`}
        onClick={onOpen}
        aria-label={`Open ${album.title}`}
      >
        {previewItems.length > 0 ? (
          previewItems.map((asset, index) => (
            <div className="gallery-collage__cell" key={asset.id}>
              <GalleryPreview asset={asset} title={album.title} />
              {index === 4 && remaining > 0 && (
                <span className="gallery-collage__more">+{remaining}</span>
              )}
            </div>
          ))
        ) : (
          <span className="gallery-collage__empty">
            {isPhoto ? <Images size={34} aria-hidden /> : <Video size={34} aria-hidden />}
            Media coming soon
          </span>
        )}
      </button>
      <div className="gallery-collection-card__body">
        <div className="gallery-collection-card__heading">
          <h2>{album.title}</h2>
          <span className="gallery-collection-card__count">{countLabel}</span>
        </div>
        {album.description && (
          <p className="gallery-collection-card__excerpt">{album.description}</p>
        )}
        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={onOpen}
          disabled={album.items.length === 0}
        >
          View {isPhoto ? 'photos' : 'videos'}
        </Button>
      </div>
    </Card>
  );
}

export function GalleryPage() {
  const [mediaType, setMediaType] = useState<GalleryMediaType>('photo');
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAlbums(await getPublishedGalleryAlbums(mediaType));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load the gallery.');
    } finally {
      setLoading(false);
    }
  }, [mediaType]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, reloadKey]);

  useEffect(() => {
    if (!activeAlbum) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveAlbum(null);
      if (event.key === 'ArrowLeft') {
        setActiveIndex((value) => (value - 1 + activeAlbum.items.length) % activeAlbum.items.length);
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((value) => (value + 1) % activeAlbum.items.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeAlbum]);

  const openAlbum = (album: GalleryAlbum) => {
    if (album.items.length === 0) return;
    setActiveIndex(0);
    setActiveAlbum(album);
  };

  const activeAsset = activeAlbum?.items[activeIndex] || null;

  return (
    <main className="m3-gallery-page">
      <PageHero
        eyebrow="Celebration archive"
        title="Photo & video gallery"
        description="Collections of faith, culture, and community from past Sinoog celebrations — browse by photos or videos."
      />

      <section className="section gallery-page">
        <div className="container">
          {/* Segmented controller: Photos | Videos */}
          <div className="gallery-switcher gallery-switcher--segmented" role="tablist" aria-label="Gallery type">
            <button
              type="button"
              role="tab"
              aria-selected={mediaType === 'photo'}
              className={mediaType === 'photo' ? 'active' : ''}
              onClick={() => setMediaType('photo')}
            >
              <Images size={18} aria-hidden /> Photos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mediaType === 'video'}
              className={mediaType === 'video' ? 'active' : ''}
              onClick={() => setMediaType('video')}
            >
              <Video size={18} aria-hidden /> Videos
            </button>
          </div>

          {loading ? (
            <LoadingState message={`Loading ${mediaType === 'photo' ? 'photo' : 'video'} collections…`} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />
          ) : albums.length === 0 ? (
            <EmptyState
              title={`No ${mediaType} collections yet`}
              message="Published collections will appear here after the Sinoog Committee adds and approves them."
            />
          ) : (
            <div className="gallery-collections-grid">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} onOpen={() => openAlbum(album)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Full-screen lightbox / in-page video player */}
      {activeAlbum && activeAsset && (
        <div
          className="gallery-viewer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-viewer-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setActiveAlbum(null);
          }}
        >
          <div className="gallery-viewer__panel">
            <header>
              <div>
                <span>
                  {activeIndex + 1} of {activeAlbum.items.length}
                </span>
                <h2 id="gallery-viewer-title">{activeAlbum.title}</h2>
              </div>
              <button
                type="button"
                className="gallery-icon-button"
                onClick={() => setActiveAlbum(null)}
                aria-label="Close gallery viewer"
              >
                <X size={20} />
              </button>
            </header>

            <div className="gallery-viewer__stage">
              {activeAsset.kind === 'image' ? (
                <img
                  src={activeAsset.publicUrl}
                  alt={activeAsset.alt_text || activeAlbum.title}
                />
              ) : (
                <iframe
                  src={activeAsset.object_path}
                  title={activeAsset.title || activeAlbum.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              )}
              {activeAlbum.items.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-viewer__nav gallery-viewer__nav--prev"
                    onClick={() =>
                      setActiveIndex(
                        (value) => (value - 1 + activeAlbum.items.length) % activeAlbum.items.length,
                      )
                    }
                    aria-label="Previous item"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    className="gallery-viewer__nav gallery-viewer__nav--next"
                    onClick={() =>
                      setActiveIndex((value) => (value + 1) % activeAlbum.items.length)
                    }
                    aria-label="Next item"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {(activeAsset.title ||
              activeAsset.caption ||
              activeAsset.credit ||
              activeAlbum.description) && (
              <div className="gallery-viewer__caption">
                {activeAsset.title && <strong>{activeAsset.title}</strong>}
                <p>{activeAsset.caption || activeAlbum.description}</p>
                {activeAsset.credit && (
                  <small className="gallery-viewer__credit">Photo credit: {activeAsset.credit}</small>
                )}
              </div>
            )}

            <div className="gallery-viewer__thumbs" aria-label="Collection items">
              {activeAlbum.items.map((asset, index) => {
                const source =
                  asset.kind === 'video' ? getYouTubeThumbnail(asset.object_path) : asset.publicUrl;
                return (
                  <button
                    type="button"
                    className={index === activeIndex ? 'active' : ''}
                    key={asset.id}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`View item ${index + 1}`}
                  >
                    {source && <img src={source} alt="" loading="lazy" />}
                    {asset.kind === 'video' && <Play size={15} fill="currentColor" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
