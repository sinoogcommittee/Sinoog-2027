import { useEffect, useState } from 'react';
import { Clock, Map, PackageOpen, Route, ArrowRight, CheckCircle2, LogIn } from 'lucide-react';
import { Button } from '../../components/Button';
import { PageHero } from '../../components/PageHero';
import { SectionHeading } from '../../components/SectionHeading';
import {
  getRunEventAndCategories,
  type RunCategory,
} from '../../features/run/runQueries';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { useAuth } from '../../features/auth/useAuth';

export function RunPage({ section }: { section?: 'routes' }) {
  const { user, isDemoAdmin } = useAuth();
  const signedIn = Boolean(user) || isDemoAdmin;

  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        if (!mounted) return;
        setRegistrationOpen(ed.registration_open);
        const { categories: cats } = await getRunEventAndCategories(ed.id);
        if (!mounted) return;
        setCategories(cats);
      } catch (err: unknown) {
        console.warn('Failed to load run data on RunPage:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHero
        eyebrow="January 9, 2027 · Sinoog Run"
        title={section === 'routes' ? 'Official Run Routes' : 'Run With Purpose'}
        description="Begin our parish celebration with a shared stride through the scenic roads of Guinacot, Guindulman, Bohol."
      >
        <div className="button-row">
          {signedIn ? (
            <>
              <Button to="/run/register">
                {registrationOpen ? 'Register now' : 'Registration status'}
              </Button>
              <Button to="/account" variant="secondary">
                My runner account
              </Button>
            </>
          ) : (
            <>
              <Button to="/signin">
                <LogIn size={17} /> Runner sign in
              </Button>
              <Button to="/signin?mode=signup" variant="secondary">
                New runner? Sign up
              </Button>
            </>
          )}
          <Button to={section === 'routes' ? '/run' : '/run/routes'} variant="ghost">
            {section === 'routes' ? 'Run overview' : 'View routes'}
          </Button>
        </div>
      </PageHero>

      <section className="section">
        <div className="container">
          {section === 'routes' ? (
            <div>
              <SectionHeading
                eyebrow="Course Guide"
                title="Routes & Checkpoints"
                description="All distance categories begin and finish at the Guinacot Parish Grounds with complete medical posts and water stations."
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                  marginTop: '2rem',
                }}
              >
                <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '1.75rem', borderRadius: '8px' }}>
                  <span className="activity-type activity-type--run">3 Kilometers</span>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', margin: '0.5rem 0' }}>
                    3K Family & Youth Loop
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    Starts at Sto. Niño Church entrance, proceeds south along the barangay coastal road, turning around at
                    the 1.5K mark near Guinacot Elementary School.
                  </p>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                    <strong>Water Station:</strong> At turnaround point · <strong>Gun Start:</strong> 6:00 AM
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '1.75rem', borderRadius: '8px' }}>
                  <span className="activity-type activity-type--run">5 Kilometers</span>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', margin: '0.5rem 0' }}>
                    5K Community Course
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    Out-and-back course along the provincial highway scenic route with rolling coastal hills and wide
                    paved lanes.
                  </p>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                    <strong>Water Stations:</strong> 2K and 3.5K marks · <strong>Gun Start:</strong> 5:45 AM
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '1.75rem', borderRadius: '8px' }}>
                  <span className="activity-type activity-type--run">10 Kilometers</span>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', margin: '0.5rem 0' }}>
                    10K Coastal Challenge
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    Full challenge route toward Guindulman poblacion boundary and back, featuring timed checkpoints and
                    mobile paramedic escorts.
                  </p>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                    <strong>Water Stations:</strong> Every 2.5 KM · <strong>Gun Start:</strong> 5:15 AM
                  </div>
                </div>
              </div>

              <div className="route-placeholder" style={{ marginTop: '2.5rem' }}>
                <Map />
                <h2>Official GPS Map in Review</h2>
                <p>
                  The municipal engineering and traffic management committee is reviewing the final road barricade plan.
                  Verified map diagrams will be published here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <SectionHeading
                eyebrow="Event Information"
                title="Distance Categories & Race Kits"
                description="Choose the distance that fits your training and celebrate with our community."
              />

              {!signedIn && (
                <div
                  className="notice"
                  style={{ marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}
                >
                  <LogIn size={20} />
                  <span style={{ flex: '1 1 220px' }}>
                    <strong>Runner account required.</strong> Sign in or create a free runner account before registration.
                  </span>
                  <Button to="/signin" variant="secondary">
                    Runner sign in
                  </Button>
                  <Button to="/signin?mode=signup" variant="ghost">
                    Sign up
                  </Button>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '3rem',
                }}
              >
                {categories.map((c) => {
                  const feeFormatted = (c.fee_centavos / 100).toLocaleString('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                  });
                  return (
                    <div
                      key={c.id}
                      style={{
                        background: '#fff',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        padding: '2rem',
                        boxShadow: 'var(--shadow)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span className="activity-type activity-type--run">{c.distance_meters / 1000} KM</span>
                        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', margin: '0.5rem 0 0.25rem' }}>
                          {c.name}
                        </h3>
                        <p style={{ color: 'var(--wine)', fontWeight: 700, fontSize: '1.5rem', margin: '0.25rem 0 1rem' }}>
                          {feeFormatted}
                        </p>
                        <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                          {c.kit_description}
                        </p>
                      </div>

                      <div
                        style={{
                          borderTop: '1px solid #eee',
                          paddingTop: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <small style={{ color: 'var(--muted)' }}>
                          Age: {c.min_age ? `${c.min_age}+ yrs` : 'Open'}
                        </small>
                        <Button
                          to={signedIn ? '/run/register' : '/signin?next=/run/register'}
                          variant="secondary"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
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
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="feature-cards">
                <article>
                  <Route />
                  <h3>Scenic Route</h3>
                  <p>Guinacot coastal corridor with clear signage and safety marshals.</p>
                  <strong>Certified Distance</strong>
                </article>
                <article>
                  <PackageOpen />
                  <h3>Official Race Kit</h3>
                  <p>Event singlet, bib, finisher medal, and refreshments included.</p>
                  <strong>Exclusive Edition</strong>
                </article>
                <article>
                  <Clock />
                  <h3>Race-Day Guide</h3>
                  <p>Assembly begins 4:30 AM at Sto. Niño Parish Grounds.</p>
                  <strong>January 9, 2027</strong>
                </article>
              </div>

              {!registrationOpen && (
                <div className="notice" style={{ marginTop: '2rem' }}>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Registration status:</strong> Portal will open once final committee approvals and payment
                    accounts are confirmed.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}