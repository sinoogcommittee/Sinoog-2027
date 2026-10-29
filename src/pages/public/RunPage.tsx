import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  LogIn,
  Map,
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
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { useAuth } from '../../features/auth/useAuth';
import type { DbRunRegistration } from '../../types';

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
  const activeUserId = user?.id || (isDemoAdmin ? 'demo-user-123' : null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        if (!mounted) return;
        const { event, categories: cats } = await getRunEventAndCategories(ed.id);
        if (!mounted) return;
        const now = Date.now();
        setRegistrationOpen(
          ed.registration_open &&
            (!event.registration_opens_at || now >= new Date(event.registration_opens_at).getTime()) &&
            (!event.registration_closes_at || now <= new Date(event.registration_closes_at).getTime()),
        );
        setRunEvent(event);
        setCategories(cats);
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

              <Card variant="outlined" className="run-route-map" aria-label="Route map placeholder">
                <div className="run-route-map__canvas">
                  <Map size={28} aria-hidden />
                  <p>
                    <strong>Interactive route map</strong>
                  </p>
                  <p>
                    Official GPX / route graphics with water stations, medical tents, and turn-around points will appear
                    here after committee and safety approval.
                  </p>
                </div>
                <ul className="run-route-map__legend">
                  <li>
                    <span className="run-route-map__dot run-route-map__dot--start" /> Start / Finish — Parish Grounds
                  </li>
                  <li>
                    <span className="run-route-map__dot run-route-map__dot--water" /> Water stations — TBA
                  </li>
                  <li>
                    <span className="run-route-map__dot run-route-map__dot--med" /> Medical tents — TBA
                  </li>
                </ul>
              </Card>

              <div className="run-category-grid">
                {categories.map((category) => (
                  <Card key={category.id} as="article" variant="outlined" className="run-category-card">
                    <span className="activity-type activity-type--run">{formatKm(category.distance_meters)}</span>
                    <h3>{category.name}</h3>
                    <p>
                      {category.distance_meters === 10000
                        ? 'Longer loop for experienced runners. Full course details pending safety approval.'
                        : category.distance_meters === 5000
                          ? 'Community stride through Guinacot. Checkpoints to be published with the official map.'
                          : 'Fun run distance for families and first-time participants.'}
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

                  return (
                    <Card key={c.id} as="article" variant="outlined" className="run-category-card">
                      <span className="activity-type activity-type--run">{formatKm(c.distance_meters)}</span>
                      <h3>{c.name}</h3>
                      <p className="run-category-card__price">{formatFee(c.fee_centavos)}</p>
                      {c.kit_description ? (
                        <p className="run-category-card__kit-text">{c.kit_description}</p>
                      ) : (
                        <ul className="run-category-card__kit">
                          <li>Event singlet / race kit</li>
                          <li>Bib number</li>
                          <li>Finisher recognition as announced</li>
                        </ul>
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
                  <p>Official course details will be published after committee and safety approval.</p>
                  <strong className="run-highlight-card__footer">Route confirmation pending</strong>
                </Card>
                <Card as="article" variant="outlined" className="run-highlight-card">
                  <div className="run-highlight-card__icon-badge">
                    <PackageOpen size={24} />
                  </div>
                  <h3>Official Race Kit</h3>
                  <p>Event singlet, bib, and finisher items as announced for each category.</p>
                  <strong className="run-highlight-card__footer">Exclusive Edition</strong>
                </Card>
                <Card as="article" variant="outlined" className="run-highlight-card">
                  <div className="run-highlight-card__icon-badge">
                    <Clock size={24} />
                  </div>
                  <h3>Race-Day Guide</h3>
                  <p>Race starts at 4:00 AM.</p>
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
    </>
  );
}
