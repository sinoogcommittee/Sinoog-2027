import { lazy, Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  LogIn,
  PackageOpen,
  RotateCcw,
  Route,
  Ruler,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { PageHero } from '../../components/PageHero';
import { SectionHeading } from '../../components/SectionHeading';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import {
  getRunEventAndCategories,
  getUserRegistration,
  type RunCategory,
  type RunEvent,
} from '../../features/run/runQueries';
import { getCurrentEdition, getSiteSettings, type SiteSettingsMap } from '../../features/editions/editionQueries';
import { useAuth } from '../../features/auth/useAuth';
import type { DbRunRegistration } from '../../types';

const InteractiveRouteMap = lazy(() =>
  import('../../components/run/InteractiveRouteMap').then((module) => ({ default: module.InteractiveRouteMap })),
);

function formatFee(centavos: number) {
  return (centavos / 100).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
}

function formatKm(meters: number) {
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km}K` : `${km} km`;
}

export function RunPage({ section }: { section?: 'routes' }) {
  const { user, isDemoAdmin } = useAuth();
  const signedIn = Boolean(user) || isDemoAdmin;

  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [runEvent, setRunEvent] = useState<RunEvent | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registration, setRegistration] = useState<DbRunRegistration | null>(null);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [raceKitsModalOpen, setRaceKitsModalOpen] = useState(false);
  const [selectedKitCategory, setSelectedKitCategory] = useState<string>('all');
  interface KitLightboxState {
    title: string;
    distanceKm: string;
    images: string[];
    currentIndex: number;
  }
  const [kitLightbox, setKitLightbox] = useState<KitLightboxState | null>(null);
  const [cardPhotoIndices, setCardPhotoIndices] = useState<Record<string, number>>({});
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap | null>(null);
  const activeUserId = user?.id || (isDemoAdmin ? 'demo-user-123' : null);

  const [mobileCategoryIdx, setMobileCategoryIdx] = useState<number>(0);
  const [sliderDragX, setSliderDragX] = useState<number>(0);
  const [isSliderDragging, setIsSliderDragging] = useState<boolean>(false);
  const sliderStartX = useRef<number | null>(null);
  const sliderStartY = useRef<number | null>(null);
  const isSliderHorizontal = useRef<boolean | null>(null);

  const handleSliderTouchStart = useCallback((e: React.TouchEvent) => {
    sliderStartX.current = e.touches[0].clientX;
    sliderStartY.current = e.touches[0].clientY;
    isSliderHorizontal.current = null;
    setIsSliderDragging(true);
    setSliderDragX(0);
  }, []);

  const handleSliderTouchMove = useCallback((e: React.TouchEvent) => {
    if (sliderStartX.current === null || sliderStartY.current === null) return;
    const dx = e.touches[0].clientX - sliderStartX.current;
    const dy = e.touches[0].clientY - sliderStartY.current;

    if (isSliderHorizontal.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isSliderHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (isSliderHorizontal.current) {
      setSliderDragX(dx);
    }
  }, []);

  const handleSliderTouchEnd = useCallback(() => {
    if (sliderStartX.current !== null && isSliderHorizontal.current) {
      if (sliderDragX < -40) {
        setMobileCategoryIdx((prev) => (prev + 1) % (categories.length || 1));
      } else if (sliderDragX > 40) {
        setMobileCategoryIdx((prev) => (prev - 1 + (categories.length || 1)) % (categories.length || 1));
      }
    }
    sliderStartX.current = null;
    sliderStartY.current = null;
    isSliderHorizontal.current = null;
    setIsSliderDragging(false);
    setSliderDragX(0);
  }, [categories.length, sliderDragX]);

  // Fullscreen Photo-only View with Zoom In/Out
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    setZoomScale((prev) => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setKitLightbox(null);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handlePrevLightboxPhoto = useCallback(() => {
    setKitLightbox((prev) => {
      if (!prev || prev.images.length <= 1) return prev;
      const nextIdx = (prev.currentIndex - 1 + prev.images.length) % prev.images.length;
      return { ...prev, currentIndex: nextIdx };
    });
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleNextLightboxPhoto = useCallback(() => {
    setKitLightbox((prev) => {
      if (!prev || prev.images.length <= 1) return prev;
      const nextIdx = (prev.currentIndex + 1) % prev.images.length;
      return { ...prev, currentIndex: nextIdx };
    });
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(1);
  const viewerPanStart = useRef<{ x: number; y: number } | null>(null);
  const lastPanOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastViewerTapTime = useRef<number>(0);

  const handleViewerTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDist.current = dist;
      pinchStartScale.current = zoomScale;
    } else if (e.touches.length === 1) {
      viewerPanStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPanOffset.current = panOffset;
    }
  }, [zoomScale, panOffset]);

  const handleViewerTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.max(1, Math.min(4, (dist / pinchStartDist.current) * pinchStartScale.current));
      setZoomScale(newScale);
      if (newScale === 1) setPanOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && viewerPanStart.current !== null && zoomScale > 1) {
      const dx = e.touches[0].clientX - viewerPanStart.current.x;
      const dy = e.touches[0].clientY - viewerPanStart.current.y;
      setPanOffset({
        x: lastPanOffset.current.x + dx,
        y: lastPanOffset.current.y + dy,
      });
    }
  }, [zoomScale]);

  const handleViewerTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDist.current = null;
    }
    if (e.touches.length === 0 && viewerPanStart.current !== null) {
      const now = Date.now();
      if (now - lastViewerTapTime.current < 300) {
        setZoomScale((prev) => {
          if (prev > 1) {
            setPanOffset({ x: 0, y: 0 });
            return 1;
          }
          return 2.5;
        });
      } else if (zoomScale <= 1) {
        const deltaX = e.changedTouches[0].clientX - viewerPanStart.current.x;
        if (deltaX > 45) {
          handlePrevLightboxPhoto();
        } else if (deltaX < -45) {
          handleNextLightboxPhoto();
        }
      }
      lastViewerTapTime.current = now;
      viewerPanStart.current = null;
    }
  }, [zoomScale, handlePrevLightboxPhoto, handleNextLightboxPhoto]);

  const handleViewerWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(prev + 0.3, 4));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(prev - 0.3, 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  const handleImageDoubleTap = useCallback(() => {
    setZoomScale((prev) => {
      if (prev > 1) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      return 2.5;
    });
  }, []);

  useEffect(() => {
    if (!kitLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && zoomScale === 1) {
        e.preventDefault();
        handlePrevLightboxPhoto();
      } else if (e.key === 'ArrowRight' && zoomScale === 1) {
        e.preventDefault();
        handleNextLightboxPhoto();
      } else if (e.key === 'Escape') {
        handleCloseFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kitLightbox, zoomScale, handleCloseFullscreen, handlePrevLightboxPhoto, handleNextLightboxPhoto, handleZoomIn, handleZoomOut]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        if (!mounted) return;
        const [{ event, categories: cats }, settings] = await Promise.all([
          getRunEventAndCategories(ed.id),
          getSiteSettings(ed.id).catch(() => ({})),
        ]);
        if (!mounted) return;
        const now = Date.now();
        setRegistrationOpen(
          ed.registration_open &&
            (!event.registration_opens_at || now >= new Date(event.registration_opens_at).getTime()) &&
            (!event.registration_closes_at || now <= new Date(event.registration_closes_at).getTime()),
        );
        setRunEvent(event);
        setCategories(cats);
        setSiteSettings(settings);
        if (activeUserId) {
          const state = await getUserRegistration(event.id, activeUserId);
          if (mounted) setRegistration(state.registration);
        }
      } catch (err: unknown) {
        console.warn('Failed to load run data on RunPage:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeUserId]);

  type StoredRaceKits = NonNullable<NonNullable<SiteSettingsMap['race_kits']>['kits']>;

  const storedRaceKits: StoredRaceKits = siteSettings?.race_kits?.kits || (() => {
    try {
      const cached = localStorage.getItem('sinoog_race_kits');
      return cached ? (JSON.parse(cached) as StoredRaceKits) : {};
    } catch {
      return {};
    }
  })();

  const hasActiveRegistration = Boolean(registration && !['rejected', 'cancelled'].includes(registration.status));
  const isApproved = registration?.status === 'approved';

  const primaryRegisterHref = signedIn
    ? '/run/register'
    : '/signin?next=/run/register';
  const primaryRegisterLabel = isApproved
    ? 'Registered'
    : hasActiveRegistration
      ? 'Registration status'
      : registrationOpen
        ? 'Register now'
        : 'Registration status';

  return (
    <>
      <PageHero
        eyebrow="January 9, 2027 · Sinoog Run"
        title={section === 'routes' ? 'Official Run Routes' : 'Run With Purpose'}
        description="Begin our parish celebration with a shared stride through the scenic roads of Guinacot, Guindulman, Bohol."
      >
        {/* Single primary CTA row — avoids empty secondary box in the hero */}
        <div className="run-hero-actions">
          <Button to={primaryRegisterHref}>
            {primaryRegisterLabel} <ArrowRight size={17} />
          </Button>
          {signedIn ? (
            <Button to="/account" variant="ghost">
              My runner account
            </Button>
          ) : (
            <Button to="/signin" variant="ghost">
              <LogIn size={17} /> Runner sign in
            </Button>
          )}
          <Button to={section === 'routes' ? '/run' : '/run/routes'} variant="ghost">
            {section === 'routes' ? 'Run overview' : 'View routes'}
          </Button>
        </div>
      </PageHero>

      <section className="section m3-run-page">
        <div className="container">
          {section === 'routes' ? (
            <div className="run-routes">
              <SectionHeading
                eyebrow="Course Guide"
                title="Routes & Checkpoints"
                description="All distance categories begin and finish at the Guinacot Parish Grounds. Water stations and medical posts will be marked on the official course once approved."
              />

              <Suspense fallback={<div className="run-route-map-loading">Loading interactive route map…</div>}>
                <InteractiveRouteMap />
              </Suspense>

              <div className="run-category-grid">
                {categories.map((category) => (
                  <Card key={category.id} as="article" variant="outlined" className="run-category-card">
                    <span className="activity-type activity-type--run">{formatKm(category.distance_meters)}</span>
                    <h3>{category.name}</h3>
                    <p>
                      {category.distance_meters === 10000
                        ? 'Official 10K highway double-loop along Bohol Circumferential Road. Starts at Sto. Niño Parish Grounds → Southwest to Turn 1 at Sta. Cruz - Pangpang Chapel → Northeast to Turn 2 at Sta. Cruz - East Guinacot Chapel → Finish at Sto. Niño Parish.'
                        : category.distance_meters === 5000
                          ? 'Scenic 5K highway stride along Bohol Circumferential Road starting at Sto. Niño Parish Grounds, heading Southwest past Cabantian with turnaround at Sta. Cruz - Pangpang Chapel and dedicated hydration support.'
                          : 'Family-friendly 3K highway fun run and walk starting at Sto. Niño Parish Grounds, heading Southwest along Bohol Circumferential Road with turnaround at Sta. Cruz Chapel, Cabantian.'}
                    </p>
                    <strong>{formatFee(category.fee_centavos)}</strong>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              <SectionHeading
                eyebrow="Distance categories"
                title="Choose your stride"
                description="Fees and kit inclusions follow the committee-approved categories. Registration uses the same options in the wizard."
              />

              <div className="run-category-grid">
                {categories.map((c) => {
                  const isRegisteredCategory =
                    hasActiveRegistration && registration?.category_id === c.id;
                  const canRegisterHere = registrationOpen && !hasActiveRegistration;
                  const kitData = storedRaceKits[c.id];
                  const kitImages: string[] = Array.isArray(kitData?.images) && kitData.images.length > 0
                    ? kitData.images
                    : kitData?.image_url
                      ? [kitData.image_url]
                      : [];
                  const kitDescription: string = kitData?.description || c.kit_description || '';

                  return (
                    <Card key={c.id} as="article" variant="outlined" className="run-category-card">
                      <span className="activity-type activity-type--run">{formatKm(c.distance_meters)}</span>
                      <h3>{c.name}</h3>
                      <p className="run-category-card__price">{formatFee(c.fee_centavos)}</p>
                      {kitDescription ? (
                        <p className="run-category-card__kit-text">{kitDescription}</p>
                      ) : (
                        <ul className="run-category-card__kit">
                          <li>Event singlet / race kit</li>
                          <li>Bib number</li>
                          <li>Finisher recognition as announced</li>
                        </ul>
                      )}
                      {kitImages.length > 0 && (
                        <button
                          type="button"
                          className="run-category-card__kit-preview-btn"
                          onClick={() => {
                            setSelectedKitCategory(c.id);
                            setRaceKitsModalOpen(true);
                          }}
                        >
                          <Eye size={13} /> View official kit photo{kitImages.length > 1 ? `s (${kitImages.length})` : ''}
                        </button>
                      )}
                      {c.min_age != null || c.max_age != null ? (
                        <p className="run-category-card__age">
                          Age:{' '}
                          {c.min_age != null && c.max_age != null
                            ? `${c.min_age}–${c.max_age}`
                            : c.min_age != null
                              ? `${c.min_age}+`
                              : `up to ${c.max_age}`}
                        </p>
                      ) : (
                        <p className="run-category-card__age">Age requirements as published at registration</p>
                      )}
                      <div className="run-category-card__action">
                        {isRegisteredCategory ? (
                          <span className="run-category-card__status">
                            {isApproved ? 'Registered' : 'Registration submitted'} <CheckCircle2 size={14} />
                          </span>
                        ) : hasActiveRegistration ? (
                          <span className="run-category-card__status run-category-card__status--muted">
                            Already registered in another category
                          </span>
                        ) : canRegisterHere ? (
                          <Button to={signedIn ? '/run/register' : '/signin?next=/run/register'} variant="secondary">
                            {signedIn ? (
                              <>
                                Register <ArrowRight size={14} />
                              </>
                            ) : (
                              <>
                                Sign in to register <ArrowRight size={14} />
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="run-category-card__status run-category-card__status--muted">
                            Registration closed or not yet open
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Official Race Kits Showcase - Visual Preview */}
              {(() => {
                const getCategoryKitImages = (catId: string): string[] => {
                  const kitData = storedRaceKits[catId];
                  return Array.isArray(kitData?.images) && kitData.images.length > 0
                    ? kitData.images
                    : kitData?.image_url
                      ? [kitData.image_url]
                      : [];
                };

                return (
                  <div className="run-kits-showcase">
                    {/* Desktop View: Full 3-card grid */}
                    <div className="run-kits-showcase-desktop">
                      <div className="run-kits-showcase-grid">
                        {categories.map((c) => {
                          const kitData = storedRaceKits[c.id];
                          const kitImages: string[] = Array.isArray(kitData?.images) && kitData.images.length > 0
                            ? kitData.images
                            : kitData?.image_url
                              ? [kitData.image_url]
                              : [];
                          const activePhotoIdx = cardPhotoIndices[c.id] || 0;
                          const currentPhoto = kitImages[activePhotoIdx] || kitImages[0];

                          return (
                            <div key={`showcase-${c.id}`} className="run-kit-showcase-card">
                              <div className="run-kit-showcase-card__header">
                                <span className="activity-type activity-type--run">{formatKm(c.distance_meters)}</span>
                                <h3 className="run-kit-showcase-card__title">{c.name}</h3>
                              </div>

                              <div
                                className="run-kit-showcase-card__media"
                                onClick={() => {
                                  if (kitImages.length > 0) {
                                    setKitLightbox({
                                      title: `${c.name} Official Race Kit`,
                                      distanceKm: formatKm(c.distance_meters),
                                      images: kitImages,
                                      currentIndex: activePhotoIdx,
                                    });
                                    setZoomScale(1);
                                    setPanOffset({ x: 0, y: 0 });
                                  }
                                }}
                                title={kitImages.length > 0 ? 'Click to view photo full screen' : undefined}
                              >
                                {kitImages.length > 0 ? (
                                  <>
                                    <img
                                      src={currentPhoto}
                                      alt={`Official Race Kit for ${c.name} - Photo ${activePhotoIdx + 1}`}
                                      className="run-kit-showcase-card__img"
                                    />

                                    {kitImages.length > 1 && (
                                      <div className="run-kit-card-photo-controls">
                                        <button
                                          type="button"
                                          className="run-kit-card-arrow-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCardPhotoIndices((prev) => ({
                                              ...prev,
                                              [c.id]: (activePhotoIdx - 1 + kitImages.length) % kitImages.length,
                                            }));
                                          }}
                                          aria-label="Previous photo"
                                        >
                                          <ChevronLeft size={16} />
                                        </button>

                                        <span className="run-kit-card-badge">
                                          {activePhotoIdx + 1} / {kitImages.length}
                                        </span>

                                        <button
                                          type="button"
                                          className="run-kit-card-arrow-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCardPhotoIndices((prev) => ({
                                              ...prev,
                                              [c.id]: (activePhotoIdx + 1) % kitImages.length,
                                            }));
                                          }}
                                          aria-label="Next photo"
                                        >
                                          <ChevronRight size={16} />
                                        </button>
                                      </div>
                                    )}

                                    {/* Eye Icon button only (no text) */}
                                    <button
                                      type="button"
                                      className="run-kit-eye-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setKitLightbox({
                                          title: `${c.name} Official Race Kit`,
                                          distanceKm: formatKm(c.distance_meters),
                                          images: kitImages,
                                          currentIndex: activePhotoIdx,
                                        });
                                        setZoomScale(1);
                                        setPanOffset({ x: 0, y: 0 });
                                      }}
                                      aria-label="Full screen photo view"
                                      title="View photo full screen"
                                    >
                                      <Eye size={18} />
                                    </button>
                                  </>
                                ) : (
                                  <div className="run-kit-modal-card__placeholder">
                                    <PackageOpen size={36} style={{ opacity: 0.6, marginBottom: '6px' }} />
                                    <strong style={{ fontSize: '0.85rem' }}>Official Kit Photo Pending</strong>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Design preview will be released by the committee.</span>
                                  </div>
                                )}
                              </div>

                              {kitImages.length > 1 && (
                                <div className="run-kit-showcase-card__thumbnails">
                                  {kitImages.map((img: string, idx: number) => (
                                    <button
                                      key={`showcase-thumb-${img}-${idx}`}
                                      type="button"
                                      className={`run-kit-showcase-card__thumb-btn ${idx === activePhotoIdx ? 'active' : ''}`}
                                      onClick={() =>
                                        setCardPhotoIndices((prev) => ({
                                          ...prev,
                                          [c.id]: idx,
                                        }))
                                      }
                                      aria-label={`Show photo ${idx + 1}`}
                                    >
                                      <img src={img} alt="" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mobile View: Animated Slider Track with Blurred Top/Bottom Peeks */}
                    <div className="run-kits-showcase-mobile">
                      <div
                        className="run-mobile-slider-viewport"
                        onTouchStart={handleSliderTouchStart}
                        onTouchMove={handleSliderTouchMove}
                        onTouchEnd={handleSliderTouchEnd}
                      >
                        <div
                          className="run-mobile-slider-track"
                          style={{
                            transform: `translateX(calc(-${mobileCategoryIdx * 100}% + ${sliderDragX}px))`,
                            transition: isSliderDragging ? 'none' : 'transform 320ms cubic-bezier(0.25, 1, 0.5, 1)',
                          }}
                        >
                          {categories.map((c, idx) => {
                            const kitData = storedRaceKits[c.id];
                            const kitImages: string[] = Array.isArray(kitData?.images) && kitData.images.length > 0
                              ? kitData.images
                              : kitData?.image_url
                                ? [kitData.image_url]
                                : [];
                            const activePhotoIdx = cardPhotoIndices[c.id] || 0;
                            const currentPhoto = kitImages[activePhotoIdx] || kitImages[0] || '';

                            const prevCat = categories[(idx - 1 + categories.length) % categories.length];
                            const nextCat = categories[(idx + 1) % categories.length];

                            const prevImages = getCategoryKitImages(prevCat.id);
                            const prevPhoto = prevImages[0] || '';

                            const nextImages = getCategoryKitImages(nextCat.id);
                            const nextPhoto = nextImages[0] || '';

                            return (
                              <div key={`m-slide-${c.id}`} className="run-mobile-slider-slide">
                                <div className="run-mobile-kit-stage">
                                  {/* TOP PEEK: Previous Category blurred */}
                                  {categories.length > 1 && (
                                    <button
                                      type="button"
                                      className="run-mobile-kit-peek run-mobile-kit-peek--top"
                                      onClick={() => setMobileCategoryIdx((idx - 1 + categories.length) % categories.length)}
                                      aria-label={`View ${prevCat.name} race kit`}
                                    >
                                      <div className="run-mobile-kit-peek__backdrop">
                                        {prevPhoto ? (
                                          <img src={prevPhoto} alt="" className="run-mobile-kit-peek__img" />
                                        ) : (
                                          <div className="run-mobile-kit-peek__placeholder">
                                            <PackageOpen size={16} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="run-mobile-kit-peek__badge">
                                        <span>▲ {formatKm(prevCat.distance_meters)} · {prevCat.name}</span>
                                      </div>
                                    </button>
                                  )}

                                  {/* CENTER ACTIVE CARD: Current Category */}
                                  <div className="run-mobile-kit-card">
                                    <div className="run-kit-showcase-card__header">
                                      <span className="activity-type activity-type--run">{formatKm(c.distance_meters)}</span>
                                      <h3 className="run-kit-showcase-card__title">{c.name}</h3>
                                    </div>

                                    <div
                                      className="run-kit-showcase-card__media"
                                      onClick={() => {
                                        if (kitImages.length > 0) {
                                          setKitLightbox({
                                            title: `${c.name} Official Race Kit`,
                                            distanceKm: formatKm(c.distance_meters),
                                            images: kitImages,
                                            currentIndex: activePhotoIdx,
                                          });
                                          setZoomScale(1);
                                          setPanOffset({ x: 0, y: 0 });
                                        }
                                      }}
                                    >
                                      {kitImages.length > 0 ? (
                                        <>
                                          <img
                                            src={currentPhoto}
                                            alt={`Official Race Kit for ${c.name} - Photo ${activePhotoIdx + 1}`}
                                            className="run-kit-showcase-card__img"
                                          />

                                          {kitImages.length > 1 && (
                                            <div className="run-kit-card-photo-controls">
                                              <button
                                                type="button"
                                                className="run-kit-card-arrow-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCardPhotoIndices((prev) => ({
                                                    ...prev,
                                                    [c.id]: (activePhotoIdx - 1 + kitImages.length) % kitImages.length,
                                                  }));
                                                }}
                                                aria-label="Previous photo"
                                              >
                                                <ChevronLeft size={16} />
                                              </button>

                                              <span className="run-kit-card-badge">
                                                {activePhotoIdx + 1} / {kitImages.length}
                                              </span>

                                              <button
                                                type="button"
                                                className="run-kit-card-arrow-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCardPhotoIndices((prev) => ({
                                                    ...prev,
                                                    [c.id]: (activePhotoIdx + 1) % kitImages.length,
                                                  }));
                                                }}
                                                aria-label="Next photo"
                                              >
                                                <ChevronRight size={16} />
                                              </button>
                                            </div>
                                          )}

                                          {/* Eye Icon button only (no text) */}
                                          <button
                                            type="button"
                                            className="run-kit-eye-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setKitLightbox({
                                                title: `${c.name} Official Race Kit`,
                                                distanceKm: formatKm(c.distance_meters),
                                                images: kitImages,
                                                currentIndex: activePhotoIdx,
                                              });
                                              setZoomScale(1);
                                              setPanOffset({ x: 0, y: 0 });
                                            }}
                                            aria-label="Full screen photo view"
                                            title="View photo full screen"
                                          >
                                            <Eye size={18} />
                                          </button>
                                        </>
                                      ) : (
                                        <div className="run-kit-modal-card__placeholder">
                                          <PackageOpen size={36} style={{ opacity: 0.6, marginBottom: '6px' }} />
                                          <strong style={{ fontSize: '0.85rem' }}>Official Kit Photo Pending</strong>
                                          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Design preview will be released by the committee.</span>
                                        </div>
                                      )}
                                    </div>

                                    {kitImages.length > 1 && (
                                      <div className="run-kit-showcase-card__thumbnails">
                                        {kitImages.map((img: string, tIdx: number) => (
                                          <button
                                            key={`m-showcase-thumb-${img}-${tIdx}`}
                                            type="button"
                                            className={`run-kit-showcase-card__thumb-btn ${tIdx === activePhotoIdx ? 'active' : ''}`}
                                            onClick={() =>
                                              setCardPhotoIndices((prev) => ({
                                                ...prev,
                                                [c.id]: tIdx,
                                              }))
                                            }
                                            aria-label={`Show photo ${tIdx + 1}`}
                                          >
                                            <img src={img} alt="" />
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* BOTTOM PEEK: Next Category blurred */}
                                  {categories.length > 1 && (
                                    <button
                                      type="button"
                                      className="run-mobile-kit-peek run-mobile-kit-peek--bottom"
                                      onClick={() => setMobileCategoryIdx((idx + 1) % categories.length)}
                                      aria-label={`View ${nextCat.name} race kit`}
                                    >
                                      <div className="run-mobile-kit-peek__backdrop">
                                        {nextPhoto ? (
                                          <img src={nextPhoto} alt="" className="run-mobile-kit-peek__img" />
                                        ) : (
                                          <div className="run-mobile-kit-peek__placeholder">
                                            <PackageOpen size={16} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="run-mobile-kit-peek__badge">
                                        <span>▼ {formatKm(nextCat.distance_meters)} · {nextCat.name}</span>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Slider Pagination Dots */}
                      {categories.length > 1 && (
                        <div className="run-mobile-slider-dots">
                          {categories.map((c, idx) => (
                            <button
                              key={`m-dot-${c.id}`}
                              type="button"
                              className={`run-mobile-slider-dot ${idx === mobileCategoryIdx ? 'active' : ''}`}
                              onClick={() => setMobileCategoryIdx(idx)}
                              aria-label={`Go to ${c.name} kit`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Swipe navigation hint */}
                      <div className="run-mobile-kit-swipe-hint">
                        <ChevronLeft size={14} />
                        <span>Swipe left / right to view categories</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="feature-cards run-highlights">
                <Card as="article" variant="outlined" className="run-highlight-card">
                  <div className="run-highlight-card__icon-badge">
                    <Route size={24} />
                  </div>
                  <h3>Scenic Route</h3>
                  <p>Explore official surveyed 10K, 5K, and 3K courses, elevation checkpoints, and turnarounds on our interactive route map.</p>
                  <strong className="run-highlight-card__footer">
                    <Link to="/run/routes" style={{ color: 'inherit', textDecoration: 'none' }}>
                      View interactive map →
                    </Link>
                  </strong>
                </Card>
                <Card as="article" variant="outlined" className="run-highlight-card">
                  <div className="run-highlight-card__icon-badge">
                    <PackageOpen size={24} />
                  </div>
                  <h3>Official Race Kit</h3>
                  <p>Event singlet, bib, and finisher items as announced for each category.</p>
                  <strong className="run-highlight-card__footer">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKitCategory('all');
                        setRaceKitsModalOpen(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        font: 'inherit',
                        color: 'inherit',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Show all official race kits →
                    </button>
                  </strong>
                </Card>
                <Card as="article" variant="outlined" className="run-highlight-card">
                  <div className="run-highlight-card__icon-badge">
                    <Clock size={24} />
                  </div>
                  <h3>Race-Day Guide</h3>
                  <p>Gun Starts: 10K @ 4:00 AM • 5K @ 4:30 AM • 3K @ 5:00 AM</p>
                  <strong className="run-highlight-card__footer">January 9, 2027</strong>
                </Card>
              </div>

              {!registrationOpen && (
                <div className="notice m3-run-notice m3-run-notice--registration">
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Registration status:</strong> Portal will open once final committee approvals and payment
                    accounts are confirmed.
                  </span>
                </div>
              )}

              {/* High-emphasis Red Deadline Card */}
              <Card as="section" variant="filled" className="run-deadline-card" aria-label="Registration deadline">
                <div className="run-deadline-card__inner">
                  <div className="run-deadline-card__icon-wrap">
                    <Clock size={28} aria-hidden />
                  </div>
                  <div className="run-deadline-card__content">
                    <span className="run-deadline-card__tag">CRITICAL DEADLINE</span>
                    <h3 className="run-deadline-card__title">Registration deadline:</h3>
                    <p className="run-deadline-card__date">
                      {runEvent?.registration_closes_at
                        ? new Date(runEvent.registration_closes_at).toLocaleString('en-PH', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                            timeZone: 'Asia/Manila',
                          })
                        : 'January 2, 2027 at 11:59 PM'}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </section>

      <Dialog
        open={sizeChartOpen}
        title="Event singlet size guide"
        onClose={() => setSizeChartOpen(false)}
        className="m3-run-size-dialog"
        actions={<Button type="button" variant="text" onClick={() => setSizeChartOpen(false)}>Close</Button>}
      >
        <p>
          Use this guide when choosing your shirt size during registration. Measurements are approximate; final
          sizing follows the supplier chart published by the committee.
        </p>
        <div className="m3-run-size-table-wrap">
          <table className="size-chart-table">
            <caption className="sr-only">Approximate event singlet measurements</caption>
            <thead>
              <tr><th scope="col">Size</th><th scope="col">Chest (in)</th><th scope="col">Length (in)</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">XS</th><td>32–34</td><td>25</td></tr>
              <tr><th scope="row">S</th><td>34–36</td><td>26</td></tr>
              <tr><th scope="row">M</th><td>36–38</td><td>27</td></tr>
              <tr><th scope="row">L</th><td>38–40</td><td>28</td></tr>
              <tr><th scope="row">XL</th><td>40–42</td><td>29</td></tr>
              <tr><th scope="row">2XL</th><td>42–44</td><td>30</td></tr>
            </tbody>
          </table>
        </div>
        <p className="size-chart-modal__note">
          If a supplier chart is uploaded by the committee, it will replace this reference table.
        </p>
      </Dialog>

      {/* Official Race Kits Showcase Dialog */}
      <Dialog
        open={raceKitsModalOpen}
        title="Official Sinoog Run Race Kits"
        onClose={() => setRaceKitsModalOpen(false)}
        className="m3-run-kits-dialog"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <Button
              type="button"
              variant="text"
              size="small"
              leadingIcon={<Ruler size={16} />}
              onClick={() => {
                setRaceKitsModalOpen(false);
                setSizeChartOpen(true);
              }}
            >
              View singlet size guide
            </Button>
            <Button type="button" variant="text" size="small" onClick={() => setRaceKitsModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <p style={{ margin: '0 0 16px 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
          Official commemorative apparel, race bibs, and finisher inclusions for each Sinoog Run distance. Click any kit photo to enlarge.
        </p>

        {/* Category filter tabs */}
        <div className="run-kit-modal-tabs" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            type="button"
            className={`run-kit-tab-btn ${selectedKitCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedKitCategory('all')}
          >
            All categories ({categories.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`run-kit-tab-btn ${selectedKitCategory === c.id ? 'active' : ''}`}
              onClick={() => setSelectedKitCategory(c.id)}
            >
              {formatKm(c.distance_meters)}
            </button>
          ))}
        </div>

        {/* Category kit cards list */}
        <div className="run-kit-modal-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories
            .filter((c) => selectedKitCategory === 'all' || selectedKitCategory === c.id)
            .map((c) => {
              const kitInfo = storedRaceKits[c.id];
              const kitImages: string[] = Array.isArray(kitInfo?.images) && kitInfo.images.length > 0
                ? kitInfo.images
                : kitInfo?.image_url
                  ? [kitInfo.image_url]
                  : [];
              const activePhotoIdx = cardPhotoIndices[c.id] || 0;
              const currentPhoto = kitImages[activePhotoIdx] || kitImages[0];
              const kitDescription: string = kitInfo?.description || c.kit_description || '';
              const isRegisteredCategory = hasActiveRegistration && registration?.category_id === c.id;
              const canRegisterHere = registrationOpen && !hasActiveRegistration;

              return (
                <div key={c.id} className="run-kit-modal-card">
                  <div className="run-kit-modal-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="activity-type activity-type--run">{formatKm(c.distance_meters)}</span>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--md-sys-color-on-surface)' }}>{c.name}</h3>
                    </div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--wine, #741f29)' }}>{formatFee(c.fee_centavos)}</strong>
                  </div>

                  <div className="run-kit-modal-card__body">
                    {/* Photo column with sweep / carousel support */}
                    <div className="run-kit-modal-card__photo-col">
                      {kitImages.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div
                            className="run-kit-modal-card__img-wrap"
                            onClick={() =>
                              setKitLightbox({
                                title: `${c.name} Official Race Kit`,
                                distanceKm: formatKm(c.distance_meters),
                                images: kitImages,
                                currentIndex: activePhotoIdx,
                              })
                            }
                            title="Click to full screen preview (swipeable left/right)"
                          >
                            <img
                              src={currentPhoto}
                              alt={`Official Race Kit for ${c.name} - Photo ${activePhotoIdx + 1}`}
                              className="run-kit-modal-card__img"
                            />

                            {/* Top controls: counter and sweep buttons */}
                            {kitImages.length > 1 && (
                              <div className="run-kit-card-photo-controls">
                                <button
                                  type="button"
                                  className="run-kit-card-arrow-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardPhotoIndices((prev) => ({
                                      ...prev,
                                      [c.id]: (activePhotoIdx - 1 + kitImages.length) % kitImages.length,
                                    }));
                                  }}
                                  aria-label="Previous photo"
                                >
                                  <ChevronLeft size={16} />
                                </button>

                                <span className="run-kit-card-badge">
                                  {activePhotoIdx + 1} / {kitImages.length}
                                </span>

                                <button
                                  type="button"
                                  className="run-kit-card-arrow-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardPhotoIndices((prev) => ({
                                      ...prev,
                                      [c.id]: (activePhotoIdx + 1) % kitImages.length,
                                    }));
                                  }}
                                  aria-label="Next photo"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            )}

                            {/* Eye Icon button only (no text) */}
                            <button
                              type="button"
                              className="run-kit-eye-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setKitLightbox({
                                  title: `${c.name} Official Race Kit`,
                                  distanceKm: formatKm(c.distance_meters),
                                  images: kitImages,
                                  currentIndex: activePhotoIdx,
                                });
                                setZoomScale(1);
                                setPanOffset({ x: 0, y: 0 });
                              }}
                              aria-label="Full screen photo view"
                              title="View photo full screen"
                            >
                              <Eye size={18} />
                            </button>
                          </div>

                          {/* Thumbnail row for card preview */}
                          {kitImages.length > 1 && (
                            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '2px' }}>
                              {kitImages.map((img: string, idx: number) => (
                                <button
                                  key={`${img}-${idx}`}
                                  type="button"
                                  onClick={() =>
                                    setCardPhotoIndices((prev) => ({
                                      ...prev,
                                      [c.id]: idx,
                                    }))
                                  }
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    border: idx === activePhotoIdx ? '2px solid var(--wine, #741f29)' : '1px solid var(--md-sys-color-outline-variant)',
                                    padding: 0,
                                    background: '#ffffff',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                  }}
                                  aria-label={`Show photo ${idx + 1}`}
                                >
                                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="run-kit-modal-card__placeholder">
                          <PackageOpen size={36} style={{ opacity: 0.6, marginBottom: '6px' }} />
                          <strong style={{ fontSize: '0.85rem' }}>Official Kit Photo Pending</strong>
                          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Design preview will be released by the committee.</span>
                        </div>
                      )}
                    </div>

                    {/* Inclusions column */}
                    <div className="run-kit-modal-card__details-col">
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>
                        Kit Inclusions &amp; Rewards:
                      </h4>
                      {kitDescription ? (
                        <ul className="run-kit-modal-card__list">
                          {kitDescription
                            .split(/[,•\n]+/)
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                            .map((item: string, idx: number) => (
                              <li key={idx}>
                                <CheckCircle2 size={15} style={{ color: '#2e7d32', flexShrink: 0, marginTop: '2px' }} />
                                <span>{item}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <ul className="run-kit-modal-card__list">
                          <li>
                            <CheckCircle2 size={15} style={{ color: '#2e7d32', flexShrink: 0 }} />
                            <span>Event Singlet / Event Shirt</span>
                          </li>
                          <li>
                            <CheckCircle2 size={15} style={{ color: '#2e7d32', flexShrink: 0 }} />
                            <span>Official Race Bib</span>
                          </li>
                          <li>
                            <CheckCircle2 size={15} style={{ color: '#2e7d32', flexShrink: 0 }} />
                            <span>Finisher Medal / Recognition</span>
                          </li>
                        </ul>
                      )}

                      <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {isRegisteredCategory ? (
                          <span style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={15} /> Registered in this category
                          </span>
                        ) : canRegisterHere ? (
                          <Button
                            to={signedIn ? '/run/register' : '/signin?next=/run/register'}
                            size="small"
                            variant="filled"
                            leadingIcon={<ArrowRight size={14} />}
                            onClick={() => setRaceKitsModalOpen(false)}
                          >
                            Register for {formatKm(c.distance_meters)}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Dialog>

      {/* Photo-Only Full-Screen Viewer with Zoom In / Out */}
      {kitLightbox && (
        <div
          className="run-photo-fullscreen-overlay"
          onWheel={handleViewerWheel}
        >
          {/* Top Floating Bar: Info, Zoom Controls, Close Button */}
          <div className="run-photo-fullscreen-header">
            <div className="run-photo-fullscreen-info">
              <span className="run-photo-fullscreen-title">
                {kitLightbox.distanceKm} · {kitLightbox.title}
              </span>
              {kitLightbox.images.length > 1 && (
                <span className="run-photo-fullscreen-counter">
                  {kitLightbox.currentIndex + 1} / {kitLightbox.images.length}
                </span>
              )}
            </div>

            <div className="run-photo-fullscreen-actions">
              {/* Zoom Out Button */}
              <button
                type="button"
                className="run-fullscreen-action-btn"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                aria-label="Zoom out"
                title="Zoom out (-)"
              >
                <ZoomOut size={20} />
              </button>

              {/* Zoom Scale Badge (click resets) */}
              <button
                type="button"
                className="run-fullscreen-zoom-badge"
                onClick={handleResetZoom}
                title="Click to reset zoom (100%)"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              {/* Zoom In Button */}
              <button
                type="button"
                className="run-fullscreen-action-btn"
                onClick={handleZoomIn}
                disabled={zoomScale >= 4}
                aria-label="Zoom in"
                title="Zoom in (+)"
              >
                <ZoomIn size={20} />
              </button>

              {zoomScale !== 1 && (
                <button
                  type="button"
                  className="run-fullscreen-action-btn"
                  onClick={handleResetZoom}
                  aria-label="Reset zoom"
                  title="Reset zoom"
                >
                  <RotateCcw size={18} />
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                className="run-fullscreen-close-btn"
                onClick={handleCloseFullscreen}
                aria-label="Close full screen"
                title="Close (Esc)"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Photo Canvas with Touch Zoom & Pan */}
          <div
            className="run-photo-fullscreen-canvas"
            onTouchStart={handleViewerTouchStart}
            onTouchMove={handleViewerTouchMove}
            onTouchEnd={handleViewerTouchEnd}
          >
            {/* Prev Image Arrow (when scale === 1) */}
            {kitLightbox.images.length > 1 && zoomScale === 1 && (
              <button
                type="button"
                className="run-fullscreen-nav-arrow run-fullscreen-nav-arrow--left"
                onClick={handlePrevLightboxPhoto}
                aria-label="Previous photo"
              >
                <ChevronLeft size={36} />
              </button>
            )}

            {/* The Main Image */}
            <div
              className="run-photo-fullscreen-img-wrap"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                cursor: zoomScale > 1 ? 'grab' : 'zoom-in',
              }}
              onDoubleClick={handleImageDoubleTap}
            >
              <img
                key={kitLightbox.images[kitLightbox.currentIndex]}
                src={kitLightbox.images[kitLightbox.currentIndex]}
                alt={`${kitLightbox.title} - Photo ${kitLightbox.currentIndex + 1}`}
                className="run-photo-fullscreen-img"
                draggable={false}
              />
            </div>

            {/* Next Image Arrow (when scale === 1) */}
            {kitLightbox.images.length > 1 && zoomScale === 1 && (
              <button
                type="button"
                className="run-fullscreen-nav-arrow run-fullscreen-nav-arrow--right"
                onClick={handleNextLightboxPhoto}
                aria-label="Next photo"
              >
                <ChevronRight size={36} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip (when scale === 1) */}
          {kitLightbox.images.length > 1 && zoomScale === 1 && (
            <div className="run-photo-fullscreen-footer">
              <div className="run-lightbox-thumbnails">
                {kitLightbox.images.map((thumbUrl: string, tIdx: number) => (
                  <button
                    key={`fs-thumb-${thumbUrl}-${tIdx}`}
                    type="button"
                    className={`run-lightbox-thumb-btn ${tIdx === kitLightbox.currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      setKitLightbox((prev) => (prev ? { ...prev, currentIndex: tIdx } : null));
                      setZoomScale(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    aria-label={`Go to photo ${tIdx + 1}`}
                  >
                    <img src={thumbUrl} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
