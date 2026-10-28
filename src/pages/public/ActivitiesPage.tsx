import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, UserRound, Printer } from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import { getPublishedActivities, formatActivityDateTime } from '../../features/activities/activityQueries';
import { ErrorState, LoadingState } from '../../features/ui/FeedbackStates';
import type { DbActivity, ActivityType } from '../../types';

export function ActivitiesPage({ filter: routeFilter }: { filter?: 'mass' | 'nightly' }) {
  const [manualFilter, setManualFilter] = useState<string | null>(null);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const activeFilter = manualFilter ?? routeFilter ?? 'all';

  useEffect(() => {
    let active = true;

    const typeArg = activeFilter === 'all' ? undefined : (activeFilter as ActivityType);
    const loadTimer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      void getPublishedActivities(typeArg).then((list) => {
        if (!active) return;
        setActivities(list);
      }).catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load the published schedule.');
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadTimer);
    };
  }, [activeFilter, reloadKey]);

  const pageTitle =
    activeFilter === 'mass'
      ? 'Novena & Mass Schedule'
      : activeFilter === 'nightly'
      ? 'Nightly Cultural Activities'
      : activeFilter === 'run'
      ? 'Sinoog Run Schedule'
      : activeFilter === 'festival'
      ? 'Festival & Street Dance Schedule'
      : 'Celebration Schedule';

  return (
    <>
      <PageHero
        eyebrow="Sto. Niño Parish — Guinacot"
        title={pageTitle}
        description="Official schedule for the Novena Masses, Pontifical Mass, Sinoog Run, and nightly community cultural presentations."
      />

      <section className="section">
        <div className="container">
          <div className="public-filter-bar public-filter-bar--schedule">
            <nav className="public-filter-tabs public-filter-tabs--activities" aria-label="Filter celebration schedule">
              <Link
                to="/activities"
                className={activeFilter === 'all' ? 'is-active' : ''}
                aria-current={activeFilter === 'all' ? 'page' : undefined}
                onClick={() => setManualFilter('all')}
              >
                All Events
              </Link>
              <Link
                to="/activities/masses"
                className={activeFilter === 'mass' ? 'is-active' : ''}
                aria-current={activeFilter === 'mass' ? 'page' : undefined}
                onClick={() => setManualFilter('mass')}
              >
                Novena & Masses
              </Link>
              <Link
                to="/activities/nightly"
                className={activeFilter === 'nightly' ? 'is-active' : ''}
                aria-current={activeFilter === 'nightly' ? 'page' : undefined}
                onClick={() => setManualFilter('nightly')}
              >
                Nightly Programs
              </Link>
              <button
                type="button"
                className={activeFilter === 'run' ? 'is-active' : ''}
                aria-pressed={activeFilter === 'run'}
                onClick={() => setManualFilter('run')}
              >
                Sinoog Run
              </button>
              <button
                type="button"
                className={activeFilter === 'festival' ? 'is-active' : ''}
                aria-pressed={activeFilter === 'festival'}
                onClick={() => setManualFilter('festival')}
              >
                Festival Showdown
              </button>
            </nav>

            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print schedule
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0' }}>
              <LoadingState message="Loading official celebration schedule…" />
            </div>
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={() => { setLoading(true); setReloadKey((value) => value + 1); }} />
          ) : activities.length > 0 ? (
            <div className="timeline">
              {activities.map((a) => {
                const dt = formatActivityDateTime(a.starts_at);
                const dayNum = a.starts_at ? new Date(a.starts_at).getDate().toString().padStart(2, '0') : '--';
                return (
                  <article key={a.id}>
                    <time dateTime={a.starts_at ?? undefined}>
                      <span className="timeline-weekday">{dt.weekday}</span>
                      <strong>{dayNum}</strong>
                      <span>JAN 2027</span>
                    </time>
                    <div>
                      <span className={`activity-type activity-type--${a.type}`}>{a.type}</span>
                      <h2>{a.title}</h2>
                      <p>
                        <Clock size={16} /> {dt.time}
                      </p>
                      {a.venue && (
                        <p>
                          <MapPin size={16} /> {a.venue}
                        </p>
                      )}
                      {a.celebrant && (
                        <p>
                          <UserRound size={16} /> Celebrant: {a.celebrant}
                        </p>
                      )}
                      {a.description && (
                        <p style={{ marginTop: '0.5rem', color: '#554941', fontSize: '0.94rem' }}>
                          {a.description}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <CalendarDays size={42} />
              <h3>Activities will be posted here</h3>
              <p>The committee is currently confirming the final schedule for this section.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
