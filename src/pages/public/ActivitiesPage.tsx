import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, UserRound, Printer } from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import { getPublishedActivities, formatActivityDateTime } from '../../features/activities/activityQueries';
import { LoadingState } from '../../features/ui/FeedbackStates';
import type { DbActivity, ActivityType } from '../../types';

export function ActivitiesPage({ filter: routeFilter }: { filter?: 'mass' | 'nightly' }) {
  const [manualFilter, setManualFilter] = useState<string | null>(null);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const activeFilter = manualFilter ?? routeFilter ?? 'all';

  useEffect(() => {
    let active = true;

    const typeArg = activeFilter === 'all' ? undefined : (activeFilter as ActivityType);
    void getPublishedActivities(typeArg).then((list) => {
      if (!active) return;
      setActivities(list);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [activeFilter]);

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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="filter-pills" style={{ margin: 0 }}>
              <Link
                to="/activities"
                className={activeFilter === 'all' ? 'active' : ''}
                onClick={() => setManualFilter('all')}
              >
                All Events
              </Link>
              <Link
                to="/activities/masses"
                className={activeFilter === 'mass' ? 'active' : ''}
                onClick={() => setManualFilter('mass')}
              >
                Novena & Masses
              </Link>
              <Link
                to="/activities/nightly"
                className={activeFilter === 'nightly' ? 'active' : ''}
                onClick={() => setManualFilter('nightly')}
              >
                Nightly Programs
              </Link>
              <button
                type="button"
                className={activeFilter === 'run' ? 'active' : ''}
                onClick={() => setManualFilter('run')}
              >
                Sinoog Run
              </button>
              <button
                type="button"
                className={activeFilter === 'festival' ? 'active' : ''}
                onClick={() => setManualFilter('festival')}
              >
                Festival Showdown
              </button>
            </div>

            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={16} /> Print schedule
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0' }}>
              <LoadingState message="Loading official celebration schedule…" />
            </div>
          ) : activities.length > 0 ? (
            <div className="timeline">
              {activities.map((a) => {
                const dt = formatActivityDateTime(a.starts_at);
                const dayNum = a.starts_at ? new Date(a.starts_at).getDate().toString().padStart(2, '0') : '--';
                return (
                  <article key={a.id}>
                    <time>
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
