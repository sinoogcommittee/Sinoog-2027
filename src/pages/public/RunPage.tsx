import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  LogIn,
  PackageOpen,
  Route,
  Ruler,
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
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap | null>(null);
  const activeUserId = user?.id || (isDemoAdmin ? 'demo-user-123' : null);

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

  const storedRaceKits = siteSettings?.race_kits?.kits || (() => {
    try {
      const cached = localStorage.getItem('sinoog_race_kits');
      return cached ? JSON.parse(cached) : {};
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
                  const kitImage = kitData?.image_url;
                  const kitDescription = kitData?.description || c.kit_description;

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
                      {kitImage && (
                        <button
                          type="button"
                          className="run-category-card__kit-preview-btn"
                          onClick={() => {
                            setSelectedKitCategory(c.id);
                            setRaceKitsModalOpen(true);
                          }}
                        >
                          <Eye size={13} /> View official kit photo
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

              <div className="run-utility-row">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  leadingIcon={<PackageOpen size={18} />}
                  onClick={() => {
                    setSelectedKitCategory('all');
                    setRaceKitsModalOpen(true);
                  }}
                >
                  Show all official race kits
                </Button>
                <Button type="button" variant="text" size="small" leadingIcon={<Ruler size={18} />} onClick={() => setSizeChartOpen(true)}>
                  View size chart
                </Button>
                <Button to="/run/routes" variant="text" size="small" leadingIcon={<Route size={18} />}>
                  Route map & checkpoints
                </Button>
              </div>

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
              const kitImage = kitInfo?.image_url;
              const kitDescription = kitInfo?.description || c.kit_description;
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
                    {/* Photo column */}
                    <div className="run-kit-modal-card__photo-col">
                      {kitImage ? (
                        <div
                          className="run-kit-modal-card__img-wrap"
                          onClick={() => setLightboxImage({ url: kitImage, title: `${c.name} Official Race Kit` })}
                          title="Click to view full image"
                        >
                          <img src={kitImage} alt={`Official Race Kit for ${c.name}`} className="run-kit-modal-card__img" />
                          <span className="run-kit-modal-card__zoom-hint">
                            <Eye size={13} /> Click to enlarge
                          </span>
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
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((item, idx) => (
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

      {/* Lightbox / Zoom Dialog */}
      {lightboxImage && (
        <Dialog
          open={Boolean(lightboxImage)}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
          className="m3-run-lightbox-dialog"
          actions={<Button type="button" variant="text" size="small" onClick={() => setLightboxImage(null)}>Close</Button>}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', overflow: 'hidden' }}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            />
          </div>
        </Dialog>
      )}
    </>
  );
}
