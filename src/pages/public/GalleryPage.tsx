import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Images, Play, Video, X } from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import {
  getPublishedGalleryAlbums,
  getYouTubeThumbnail,
  type GalleryAlbum,
  type GalleryAsset,
  type GalleryMediaType,
} from '../../features/media/galleryQueries';
import { EmptyState, ErrorState, LoadingState } from '../../features/ui/FeedbackStates';

type GalleryPeriod = 'current' | 'previous';

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
            // maxresdefault is missing on some older videos — fall back to 16:9 mqdefault, then hq720
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
  return (
    <article className={`gallery-collection-card${album.media_type === 'video' ? ' gallery-collection-card--video' : ''}`}>
      <button
        type="button"
        className={`gallery-collage gallery-collage--${Math.min(previewItems.length, 5)}${album.media_type === 'video' ? ' gallery-collage--video' : ''}`}
        onClick={onOpen}
      >
        {previewItems.length > 0 ? previewItems.map((asset, index) => (
          <div className="gallery-collage__cell" key={asset.id}>
            <GalleryPreview asset={asset} title={album.title} />
            {index === 4 && remaining > 0 && <span className="gallery-collage__more">+{remaining}</span>}
          </div>
        )) : (
          <span className="gallery-collage__empty">
            {album.media_type === 'photo' ? <Images size={34} /> : <Video size={34} />}
            Media coming soon
          </span>
        )}
      </button>
      <div className="gallery-collection-card__body">
        <div>
          <span className="eyebrow">{album.year} celebration</span>
          <h2>{album.title}</h2>
        </div>
        <span className="gallery-collection-card__count">
          {album.items.length} {album.media_type === 'photo' ? (album.items.length === 1 ? 'photo' : 'photos') : (album.items.length === 1 ? 'video' : 'videos')}
        </span>
        {album.description && <p>{album.description}</p>}
        <button type="button" className="button button--secondary button--sm" onClick={onOpen} disabled={album.items.length === 0}>
          View {album.media_type === 'photo' ? 'photos' : 'videos'}
        </button>
      </div>
    </article>
  );
}

export function GalleryPage() {
  const [mediaType, setMediaType] = useState<GalleryMediaType>('photo');
  const [period, setPeriod] = useState<GalleryPeriod>('current');
  const [currentYear, setCurrentYear] = useState(2027);
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
      const [edition, list] = await Promise.all([getCurrentEdition(), getPublishedGalleryAlbums(mediaType)]);
      setCurrentYear(edition.year);
      setAlbums(list);
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
      if (event.key === 'ArrowLeft') setActiveIndex((value) => (value - 1 + activeAlbum.items.length) % activeAlbum.items.length);
      if (event.key === 'ArrowRight') setActiveIndex((value) => (value + 1) % activeAlbum.items.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeAlbum]);

  const visibleAlbums = useMemo(() => albums.filter((album) => (
    period === 'current' ? album.year === currentYear : album.year < currentYear
  )), [albums, currentYear, period]);

  const openAlbum = (album: GalleryAlbum) => {
    if (album.items.length === 0) return;
    setActiveIndex(0);
    setActiveAlbum(album);
  };

  const activeAsset = activeAlbum?.items[activeIndex] || null;

  return (
    <>
      <PageHero
        eyebrow="Celebration archive"
        title="Photo & video gallery"
        description="View moments from the current Sinoog celebration and previous years of faith, culture, and community."
      />
      <section className="section gallery-page">
        <div className="container">
          <div className="gallery-switcher" aria-label="Gallery type">
            <button type="button" className={mediaType === 'photo' ? 'active' : ''} onClick={() => setMediaType('photo')}>
              <Images size={18} /> Photos
            </button>
            <button type="button" className={mediaType === 'video' ? 'active' : ''} onClick={() => setMediaType('video')}>
              <Video size={18} /> Videos
            </button>
          </div>
          <div className="gallery-period-switcher" aria-label="Celebration year group">
            <button type="button" className={period === 'current' ? 'active' : ''} onClick={() => setPeriod('current')}>
              Current celebration ({currentYear})
            </button>
            <button type="button" className={period === 'previous' ? 'active' : ''} onClick={() => setPeriod('previous')}>
              Previous celebrations
            </button>
          </div>

          {loading ? (
            <LoadingState message={`Loading ${mediaType === 'photo' ? 'photo' : 'video'} collections…`} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />
          ) : visibleAlbums.length === 0 ? (
            <EmptyState
              title={`No ${period === 'current' ? currentYear : 'previous'} ${mediaType} collections yet`}
              message="Published collections will appear here after the Sinoog Committee adds and approves them."
            />
          ) : (
            <div className="gallery-collections-grid">
              {visibleAlbums.map((album) => <AlbumCard key={album.id} album={album} onOpen={() => openAlbum(album)} />)}
            </div>
          )}
        </div>
      </section>

      {activeAlbum && activeAsset && (
        <div className="gallery-viewer" role="dialog" aria-modal="true" aria-labelledby="gallery-viewer-title" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setActiveAlbum(null);
        }}>
          <div className="gallery-viewer__panel">
            <header>
              <div>
                <span>{activeAlbum.year} · {activeIndex + 1} of {activeAlbum.items.length}</span>
                <h2 id="gallery-viewer-title">{activeAlbum.title}</h2>
              </div>
              <button type="button" className="gallery-icon-button" onClick={() => setActiveAlbum(null)} aria-label="Close gallery viewer"><X /></button>
            </header>
            <div className="gallery-viewer__stage">
              {activeAsset.kind === 'image' ? (
                <img src={activeAsset.publicUrl} alt={activeAsset.alt_text || activeAlbum.title} />
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
                  <button type="button" className="gallery-viewer__nav gallery-viewer__nav--prev" onClick={() => setActiveIndex((value) => (value - 1 + activeAlbum.items.length) % activeAlbum.items.length)} aria-label="Previous item"><ChevronLeft /></button>
                  <button type="button" className="gallery-viewer__nav gallery-viewer__nav--next" onClick={() => setActiveIndex((value) => (value + 1) % activeAlbum.items.length)} aria-label="Next item"><ChevronRight /></button>
                </>
              )}
            </div>
            {(activeAsset.title || activeAsset.caption || activeAlbum.description) && (
              <div className="gallery-viewer__caption">
                {activeAsset.title && <strong>{activeAsset.title}</strong>}
                <p>{activeAsset.caption || activeAlbum.description}</p>
              </div>
            )}
            <div className="gallery-viewer__thumbs" aria-label="Collection items">
              {activeAlbum.items.map((asset, index) => {
                const source = asset.kind === 'video' ? getYouTubeThumbnail(asset.object_path) : asset.publicUrl;
                return (
                  <button type="button" className={index === activeIndex ? 'active' : ''} key={asset.id} onClick={() => setActiveIndex(index)} aria-label={`View item ${index + 1}`}>
                    {source && <img src={source} alt="" loading="lazy" />}
                    {asset.kind === 'video' && <Play size={15} fill="currentColor" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
