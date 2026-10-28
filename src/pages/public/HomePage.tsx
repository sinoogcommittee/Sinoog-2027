import { useEffect, useState } from 'react';
import { ArrowRight, Facebook, Globe, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { CountdownTimer } from '../../components/CountdownTimer';
import { SectionHeading } from '../../components/SectionHeading';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { getPublishedActivities, formatActivityDateTime } from '../../features/activities/activityQueries';
import { getPublishedPosts } from '../../features/content/postQueries';
import { toSafeHttpUrl } from '../../lib/safeUrl';
import { useAuth } from '../../features/auth/useAuth';
import {
  getSponsorLogoUrl,
  listPublishedEditionSponsors,
  type EditionSponsorRow,
} from '../../features/sponsors/sponsorQueries';
import type { DbActivity, NewsPost } from '../../types';
import { EmptyState, ErrorState, LoadingState } from '../../features/ui/FeedbackStates';

export function HomePage() {
  const { user, isDemoAdmin, loading: authLoading } = useAuth();
  // While the session is still being restored, treat the visitor as signed in; the registration
  // page itself waits for the session and sends anyone who is not signed in to the sign-in page.
  const canRegister = authLoading || Boolean(user) || isDemoAdmin;
  const registerHref = canRegister ? '/run/register' : '/signin?next=/run/register';
  const [activitiesList, setActivitiesList] = useState<DbActivity[]>([]);
  const [newsList, setNewsList] = useState<NewsPost[]>([]);
  const [sponsors, setSponsors] = useState<EditionSponsorRow[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadTimer = window.setTimeout(() => {
      setContentLoading(true);
      setContentError(null);
      void Promise.all([
        getCurrentEdition(),
        getPublishedActivities(),
        getPublishedPosts(),
        listPublishedEditionSponsors(),
      ])
        .then(([, acts, posts, sponsorRows]) => {
          if (!active) return;
          setActivitiesList(acts.slice(0, 6));
          setNewsList(posts.slice(0, 3));
          setSponsors(sponsorRows.slice(0, 8));
        })
        .catch((error: unknown) => {
          if (active) setContentError(error instanceof Error ? error.message : 'Unable to load official updates.');
        })
        .finally(() => {
          if (active) setContentLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadTimer);
    };
  }, [reloadKey]);

  const celebrationKeyDates = [
    {
      date: 'January 6, 2027',
      label: 'Novena begins',
      note: 'Mass schedule awaiting final parish confirmation',
    },
    {
      date: 'January 9, 2027',
      label: 'Sinoog Run',
      note: 'Opening event · Registration details coming',
    },
    {
      date: 'January 15, 2027',
      label: 'Fiesta & Sinoog Festival',
      note: 'Guinacot, Guindulman, Bohol',
    },
  ];

  return (
    <>
      {/* 01. HERO TO COUNTDOWN */}
      <section className="home-hero">
        <div className="home-hero__pattern" />
        <div className="container home-hero__inner">
          <div className="home-hero__copy">
            <p className="hero-kicker">
              <Sparkles size={16} /> Faith · Culture · Community
            </p>
            <h1>
              One faith.
              <br />
              <em>One celebration.</em>
            </h1>
            <p className="hero-lead">
              Come home to Guinacot as we honor the Holy Child through prayer, movement, music, and a community
              celebration rooted in tradition.
            </p>
            <div className="hero-actions">
              <Button to={registerHref}>
                Register for the run <ArrowRight size={17} />
              </Button>
            </div>
          </div>
          <div className="hero-emblem home-hero__emblem-desktop">
            <picture className="hero-artwork">
              <source srcSet="/images/hero_section_art.webp" type="image/webp" />
              <img
                src="/images/hero_section_art.png"
                alt="Sto. Niño Parish seal surrounded by a ceremonial festival pattern"
                width="1200"
                height="1200"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <p>SINOOG 2027</p>
            <small>Viva Pit Señor!</small>
          </div>
        </div>

        {/* Festival Live Countdown Bar — immediately under hero */}
        <CountdownTimer />
      </section>

      {/* Parish Emblem & Devotional Highlight (mobile / transitional) */}
      <section className="parish-emblem-band" aria-label="Sto. Niño Parish">
        <div className="container parish-emblem-band__inner">
          <div className="hero-emblem">
            <picture className="hero-artwork">
              <source srcSet="/images/hero_section_art.webp" type="image/webp" />
              <img
                src="/images/hero_section_art.png"
                alt="Sto. Niño Parish seal"
                width="400"
                height="400"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <p>Sto. Niño Parish</p>
            <small>SINOOG 2027 · Viva Pit Señor!</small>
          </div>
        </div>
      </section>

      {/* 02. TIMELINE TO STORY — Key Dates Preview */}
      <section className="date-band">
        <div className="container date-grid">
          {celebrationKeyDates.map((item, i) => (
            <article key={item.label}>
              <span className="date-index">0{i + 1}</span>
              <div>
                <strong>{item.date}</strong>
                <h3>{item.label}</h3>
                <p>{item.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Video Highlight + More than a festival */}
      <section className="section">
        <div className="container split-feature">
          <div className="home-teaser">
            <iframe
              src="https://www.youtube.com/embed/nN_IQG98tLQ?si=1cFq8l9ZoyeCy50L"
              title="2026 Parochial Fiesta Celebration — Sto. Niño Parish Guinacot"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <p className="home-teaser__caption">2026 Parochial Fiesta Celebration · Sto. Niño Parish — Guinacot</p>
          </div>
          <div>
            <SectionHeading
              eyebrow="A celebration with meaning"
              title="More than a festival"
              description="Sinoog brings together the devotion of the parish, the energy of our youth, and the stories of every community that calls Guinacot home."
            />
            <p>
              From the opening novena and the Sinoog Run to the festival performances and Pontifical Mass, every moment is
              an invitation to gather in gratitude and devotion.
            </p>
            <Button to="/festival" variant="ghost">
              Discover the festival <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Schedule & News Teasers */}
      <section className="section section--cream">
        <div className="container">
          <div className="heading-row">
            <SectionHeading eyebrow="Plan your celebration" title="Coming up in Guinacot" />
            <Link to="/activities">
              Full schedule <ArrowRight size={16} />
            </Link>
          </div>
          <div className="schedule-list">
            {contentLoading ? (
              <LoadingState message="Loading the official schedule…" />
            ) : contentError ? (
              <ErrorState
                message={contentError}
                onRetry={() => {
                  setContentLoading(true);
                  setReloadKey((value) => value + 1);
                }}
              />
            ) : activitiesList.length === 0 ? (
              <EmptyState
                title="Schedule confirmation in progress"
                message="Published activities will appear here after committee approval."
              />
            ) : (
              activitiesList.map((a) => {
                const dt = formatActivityDateTime(a.starts_at);
                const dayStr = a.starts_at
                  ? new Date(a.starts_at).getDate().toString().padStart(2, '0')
                  : '--';
                const monthStr = a.starts_at
                  ? new Date(a.starts_at).toLocaleString('en-US', { month: 'short', timeZone: 'Asia/Manila' }).toUpperCase()
                  : 'JAN';
                return (
                  <article key={a.id}>
                    <time>
                      <span>{dayStr}</span>
                      {monthStr}
                    </time>
                    <div>
                      <span className={`activity-type activity-type--${a.type}`}>{a.type}</span>
                      <h3>{a.title}</h3>
                      <p>
                        {dt.weekday} · {dt.time} · {a.venue || 'Guinacot'}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {newsList.length > 0 && (
            <div className="home-news-teasers">
              <h3 className="home-news-teasers__title">Latest from the committee</h3>
              <ul>
                {newsList.map((post) => (
                  <li key={post.id}>
                    <Link to={`/news/${post.slug}`}>
                      <span>{post.title}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Sinoog Run CTA banner */}
      <section className="run-cta-band">
        <div className="container run-cta-band__inner">
          <div>
            <p className="run-cta-band__eyebrow">Sinoog Run · January 9</p>
            <h2>Start the celebration in motion.</h2>
            <p>Run with the community and receive the Sinoog nest tile.</p>
          </div>
          <Button to="/run" variant="secondary">
            See run details <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      {/* Sponsor Banner Strip */}
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Our celebration partners" title="Sponsors & supporters" />
          {contentLoading ? (
            <LoadingState message="Loading partners…" />
          ) : sponsors.length > 0 ? (
            <div className="sponsor-strip sponsor-strip--cards">
              {sponsors.map((row) => {
                const logo = getSponsorLogoUrl(row.sponsor.logo_path);
                const websiteUrl = toSafeHttpUrl(row.sponsor.website_url);
                const facebookUrl = toSafeHttpUrl(row.sponsor.facebook_url);
                return (
                  <div key={row.sponsor_id} className="sponsor-strip__card">
                    <div className="sponsor-strip__logo">
                      {logo ? (
                        <img src={logo} alt="" />
                      ) : (
                        <span className="sponsor-strip__initial">{row.sponsor.name.slice(0, 1)}</span>
                      )}
                    </div>
                    <strong>{row.sponsor.name}</strong>
                    <small>{row.tier}</small>
                    {(websiteUrl || facebookUrl) && (
                      <div className="sponsor-strip__links">
                        {websiteUrl && (
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="sponsors-public__icon-link"
                            aria-label={`${row.sponsor.name} website`}
                            title="Website"
                          >
                            <Globe size={18} aria-hidden />
                          </a>
                        )}
                        {facebookUrl && (
                          <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="sponsors-public__icon-link sponsors-public__icon-link--fb"
                            aria-label={`${row.sponsor.name} on Facebook`}
                            title="Facebook"
                          >
                            <Facebook size={18} aria-hidden />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sponsor-strip">
              <span>MAJOR PARTNER</span>
              <span>COMMUNITY PARTNER</span>
              <span>MEDIA PARTNER</span>
              <span>SUPPORTER</span>
            </div>
          )}
          <div className="center-action">
            <Button to="/sponsors" variant="ghost">
              View all sponsors
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Location Card */}
      <section className="section section--cream">
        <div className="container">
          <SectionHeading eyebrow="Visit us" title="Get Directions" />
          <div className="parish-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3932.4016530129584!2d124.45346527408904!3d9.732003590360158!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aa0b0701b97f05%3A0x68fff2cb8e8183a1!2sSto.%20Ni%C3%B1o%20Parish%20-%20Guinacot%2C%20Guindulman%2C%20Bohol!5e0!3m2!1sen!2sph!4v1792984627890!5m2!1sen!2sph"
              title="Map of Sto. Niño Parish — Guinacot"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="parish-map__caption">
              <MapPin size={18} />
              <span>
                <strong>Sto. Niño Parish</strong>
                <small>Guinacot, Guindulman, Bohol</small>
              </span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sto.%20Ni%C3%B1o%20Parish%20Guinacot%20Guindulman%20Bohol"
                target="_blank"
                rel="noreferrer"
                className="parish-map__directions"
              >
                1-tap directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Mobile Quick Dock */}
      <nav className="mobile-quick-dock" aria-label="Quick actions">
        <Link to={registerHref} className="mobile-quick-dock__item">
          <span className="mobile-quick-dock__icon" aria-hidden>
            🏃
          </span>
          <span>Register for Run</span>
        </Link>
        <Link to="/activities" className="mobile-quick-dock__item">
          <span className="mobile-quick-dock__icon" aria-hidden>
            📅
          </span>
          <span>Schedule</span>
        </Link>
      </nav>
    </>
  );
}
