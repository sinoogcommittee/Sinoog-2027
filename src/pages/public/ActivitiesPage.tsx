import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  Printer,
  UserRound,
} from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import {
  formatActivityDateTime,
  getActivityDateKey,
  getPublishedActivities,
} from '../../features/activities/activityQueries';
import { EmptyState, ErrorState, LoadingState } from '../../features/ui/FeedbackStates';
import type { ActivityType, DbActivity } from '../../types';

type ScheduleFilter = 'all' | ActivityType;

const FILTER_OPTIONS: { id: ScheduleFilter; label: string; href?: string }[] = [
  { id: 'all', label: 'All Events', href: '/activities' },
  { id: 'mass', label: 'Novena & Masses', href: '/activities/masses' },
  { id: 'nightly', label: 'Nightly Programs', href: '/activities/nightly' },
  { id: 'run', label: 'Sinoog Run' },
  { id: 'festival', label: 'Festival Showdown' },
];

const TYPE_LABELS: Record<ActivityType, string> = {
  mass: 'Mass',
  run: 'Sinoog Run',
  festival: 'Festival',
  nightly: 'Nightly',
  other: 'Event',
};

function manilaTodayKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function toIcsDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // UTC form required by ICS: YYYYMMDDTHHMMSSZ
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function buildGoogleCalendarUrl(activity: DbActivity): string | null {
  const start = toIcsDate(activity.starts_at);
  if (!start) return null;
  const end = toIcsDate(activity.ends_at) ?? start;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.title,
    dates: `${start}/${end}`,
    details: activity.description ?? 'Sinoog 2027 — Sto. Niño Parish, Guinacot',
    location: activity.venue ?? 'Guinacot, Guindulman, Bohol',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs(activity: DbActivity) {
  const start = toIcsDate(activity.starts_at);
  if (!start) return;
  const end = toIcsDate(activity.ends_at) ?? start;
  const uid = `${activity.id}@sinoog2027`;
  const summary = activity.title.replace(/\n/g, ' ');
  const description = (activity.description ?? '').replace(/\n/g, '\\n');
  const location = (activity.venue ?? 'Guinacot, Guindulman, Bohol').replace(/\n/g, ' ');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sinoog Committee//Sinoog 2027//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sinoog-2027-${getActivityDateKey(activity.starts_at) || 'event'}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllIcs(list: DbActivity[]) {
  const stamp = toIcsDate(new Date().toISOString()) ?? '';
  const events = list
    .map((activity) => {
      const start = toIcsDate(activity.starts_at);
      if (!start) return null;
      const end = toIcsDate(activity.ends_at) ?? start;
      return [
        'BEGIN:VEVENT',
        `UID:${activity.id}@sinoog2027`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${activity.title.replace(/\n/g, ' ')}`,
        `DESCRIPTION:${(activity.description ?? '').replace(/\n/g, '\\n')}`,
        `LOCATION:${(activity.venue ?? 'Guinacot, Guindulman, Bohol').replace(/\n/g, ' ')}`,
        'END:VEVENT',
      ].join('\r\n');
    })
    .filter(Boolean);

  if (events.length === 0) return;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sinoog Committee//Sinoog 2027//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sinoog-2027-celebration-schedule.ics';
  a.click();
  URL.revokeObjectURL(url);
}

function groupByDate(list: DbActivity[]): { key: string; items: DbActivity[] }[] {
  const map = new Map<string, DbActivity[]>();
  for (const item of list) {
    const key = getActivityDateKey(item.starts_at) || 'tba';
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

export function ActivitiesPage({ filter: routeFilter }: { filter?: 'mass' | 'nightly' }) {
  const [manualFilter, setManualFilter] = useState<ScheduleFilter | null>(null);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const activeFilter: ScheduleFilter = manualFilter ?? routeFilter ?? 'all';
  const todayKey = useMemo(() => manilaTodayKey(), []);

  useEffect(() => {
    let active = true;
    const typeArg = activeFilter === 'all' ? undefined : activeFilter;
    const loadTimer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      void getPublishedActivities(typeArg)
        .then((list) => {
          if (!active) return;
          setActivities(list);
        })
        .catch((error: unknown) => {
          if (active) {
            setLoadError(error instanceof Error ? error.message : 'Unable to load the published schedule.');
          }
        })
        .finally(() => {
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

  const grouped = useMemo(() => groupByDate(activities), [activities]);

  return (
    <>
      <PageHero
        eyebrow="Sto. Niño Parish — Guinacot"
        title={pageTitle}
        description="Official schedule for the Novena Masses, Pontifical Mass, Sinoog Run, and nightly community cultural presentations."
      />

      <section className="section">
        <div className="container">
          {/* Filters + utility bar */}
          <div className="public-filter-bar public-filter-bar--schedule">
            <nav className="public-filter-tabs public-filter-tabs--activities" aria-label="Filter celebration schedule">
              {FILTER_OPTIONS.map((opt) =>
                opt.href ? (
                  <Link
                    key={opt.id}
                    to={opt.href}
                    className={activeFilter === opt.id ? 'is-active' : ''}
                    aria-current={activeFilter === opt.id ? 'page' : undefined}
                    onClick={() => setManualFilter(opt.id)}
                  >
                    {opt.label}
                  </Link>
                ) : (
                  <button
                    key={opt.id}
                    type="button"
                    className={activeFilter === opt.id ? 'is-active' : ''}
                    aria-pressed={activeFilter === opt.id}
                    onClick={() => setManualFilter(opt.id)}
                  >
                    {opt.label}
                  </button>
                ),
              )}
            </nav>

            <div className="schedule-utility">
              <button
                type="button"
                className="button button--secondary button--sm"
                onClick={() => window.print()}
              >
                <Printer size={16} aria-hidden /> Print schedule
              </button>
              <button
                type="button"
                className="button button--secondary button--sm"
                onClick={() => downloadAllIcs(activities)}
                disabled={activities.length === 0}
                title="Download all visible events as an .ics calendar file"
              >
                <CalendarPlus size={16} aria-hidden /> Sync to Calendar
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0' }}>
              <LoadingState message="Loading official celebration schedule…" />
            </div>
          ) : loadError ? (
            <ErrorState
              message={loadError}
              onRetry={() => {
                setLoading(true);
                setReloadKey((value) => value + 1);
              }}
            />
          ) : activities.length > 0 ? (
            <div className="schedule-timeline">
              {grouped.map(({ key, items }) => {
                const first = items[0];
                const dt = formatActivityDateTime(first.starts_at);
                const dayNum = key !== 'tba' && key.length >= 10 ? key.slice(8, 10) : '--';
                const isToday = key === todayKey;

                return (
                  <section
                    key={key}
                    className={`schedule-day${isToday ? ' schedule-day--today' : ''}`}
                    aria-label={dt.date}
                  >
                    <header className="schedule-day__header">
                      <time dateTime={key !== 'tba' ? key : undefined}>
                        <span className="schedule-day__weekday">{dt.weekday}</span>
                        <strong className="schedule-day__num">{dayNum}</strong>
                        <span className="schedule-day__month">JAN 2027</span>
                      </time>
                      {isToday && (
                        <span className="happening-today-badge" aria-label="Happening today">
                          Happening today
                        </span>
                      )}
                    </header>

                    <div className="schedule-day__cards">
                      {items.map((a) => {
                        const itemDt = formatActivityDateTime(a.starts_at);
                        const googleUrl = buildGoogleCalendarUrl(a);
                        const typeLabel = TYPE_LABELS[a.type] ?? a.type;

                        return (
                          <article key={a.id} className="schedule-card">
                            <div className="schedule-card__meta">
                              <span className={`activity-type activity-type--${a.type}`}>{typeLabel}</span>
                              {a.celebrant && (
                                <span className="celebrant-badge">
                                  <UserRound size={14} aria-hidden />
                                  {a.celebrant}
                                </span>
                              )}
                            </div>

                            <h2 className="schedule-card__title">{a.title}</h2>

                            <ul className="schedule-card__details">
                              <li>
                                <Clock size={16} aria-hidden />
                                <span>{itemDt.time}</span>
                              </li>
                              {a.venue && (
                                <li>
                                  <MapPin size={16} aria-hidden />
                                  <span>{a.venue}</span>
                                </li>
                              )}
                            </ul>

                            {a.description && <p className="schedule-card__desc">{a.description}</p>}

                            <div className="schedule-card__actions">
                              {googleUrl && (
                                <a
                                  href={googleUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="schedule-card__cal-link"
                                >
                                  <CalendarPlus size={15} aria-hidden />
                                  Google Calendar
                                </a>
                              )}
                              <button
                                type="button"
                                className="schedule-card__cal-link"
                                onClick={() => downloadIcs(a)}
                              >
                                <CalendarDays size={15} aria-hidden />
                                Add to Calendar (.ics)
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Activities will be posted here"
              message="The committee is currently confirming the final schedule for this section."
            />
          )}
        </div>
      </section>
    </>
  );
}
