import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, Facebook, Globe, MapPin, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { SectionHeading } from '../../components/SectionHeading';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { getPublishedActivities, formatActivityDateTime } from '../../features/activities/activityQueries';
import { getPublishedPosts } from '../../features/content/postQueries';
import { getPublicMediaUrl } from '../../features/media/mediaQueries';
import {
  getSponsorLogoUrl,
  listPublishedEditionSponsors,
  type EditionSponsorRow,
} from '../../features/sponsors/sponsorQueries';
import type { DbActivity, NewsPost } from '../../types';
import { EmptyState, ErrorState, LoadingState } from '../../features/ui/FeedbackStates';

export function HomePage() {
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
      ]).then(([, acts, posts, sponsorRows]) => {
        if (!active) return;
        setActivitiesList(acts.slice(0, 4));
        setNewsList(posts.slice(0, 3));
        setSponsors(sponsorRows.slice(0, 8));
      }).catch((error: unknown) => {
        if (active) setContentError(error instanceof Error ? error.message : 'Unable to load official updates.');
      }).finally(() => {
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
      note: 'Opening event · Registration details coming soon',
    },
    {
      date: 'January 15, 2027',
      label: 'Fiesta & Sinoog Festival',
      note: 'Guinacot, Guindulman, Bohol',
    },
  ];

  return (
    <>
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
              <Button to="/run/register">
                Register for the run <ArrowRight size={17} />
              </Button>
              <Button to="/activities" variant="secondary">
                View celebration schedule
              </Button>
            </div>
            <div className="hero-location">
              <MapPin />
              <span>
                <strong>Sto. Niño Parish</strong>
                <small>Guinacot, Guindulman, Bohol</small>
              </span>
            </div>
          </div>
          <div className="hero-emblem">
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
        <div className="wave-divider" />
      </section>

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

      <section className="section">
        <div className="container split-feature">
          <div className="media-placeholder media-placeholder--video">
            <button type="button" aria-label="Play celebration teaser">
              <Play fill="currentColor" />
            </button>
            <span>2027 celebration teaser</span>
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

      <section className="section section--cream">
        <div className="container">
          <div className="heading-row">
            <SectionHeading eyebrow="Plan your celebration" title="Coming up in Guinacot" />
            <Link to="/activities">
              Full schedule <ArrowRight size={16} />
            </Link>
          </div>
          <div className="schedule-list">
            {contentLoading ? <LoadingState message="Loading the official schedule…" /> : contentError ? (
              <ErrorState message={contentError} onRetry={() => { setContentLoading(true); setReloadKey((value) => value + 1); }} />
            ) : activitiesList.length === 0 ? (
              <EmptyState title="Schedule confirmation in progress" message="Published activities will appear here after committee approval." />
            ) : activitiesList.map((a) => {
              const dt = formatActivityDateTime(a.starts_at);
              const dayStr = a.starts_at
                ? new Date(a.starts_at).getDate().toString().padStart(2, '0')
                : '--';
              return (
                <article key={a.id}>
                  <time>
                    <span>{dayStr}</span>JAN
                  </time>
                  <div>
                    <span className={`activity-type activity-type--${a.type}`}>{a.type}</span>
                    <h3>{a.title}</h3>
                    <p>
                      {dt.time} · {a.venue || 'Guinacot'}
                    </p>
                  </div>
                  <ChevronRight />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="heading-row">
            <SectionHeading eyebrow="From the committee" title="Latest news & announcements" />
            <Link to="/news">
              All news <ArrowRight size={16} />
            </Link>
          </div>
          <div className="news-grid">
            {contentLoading ? <LoadingState message="Loading official announcements…" /> : contentError ? (
              <ErrorState message={contentError} onRetry={() => { setContentLoading(true); setReloadKey((value) => value + 1); }} />
            ) : newsList.length === 0 ? (
              <EmptyState title="No published announcements" message="Committee announcements will appear here once published." />
            ) : newsList.map((post, i) => (
              <Link
                to={`/news/${post.slug}`}
                className={`news-card ${i === 0 ? 'news-card--featured' : ''}`}
                key={post.id}
              >
                <div
                  className="news-card__image"
                  style={
                    post.featuredImagePath
                      ? {
                          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7), transparent), url(${getPublicMediaUrl(post.featuredImagePath)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  <span>{post.category}</span>
                </div>
                <div className="news-card__body">
                  <small>{post.publishedAt}</small>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <span className="text-link">
                    Read story <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--wine">
        <div className="container cta-panel">
          <div>
            <p className="eyebrow">Sinoog Run · January 9</p>
            <h2>Start the celebration in motion.</h2>
            <p>
              Run with the community and receive the official event kit. Distances, rates, and the approved route will be
              announced soon.
            </p>
          </div>
          <Button to="/run">
            See run details <ArrowRight size={17} />
          </Button>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="With gratitude"
            title="Our celebration partners"
            description={
              sponsors.length > 0
                ? 'Partners supporting the parish fiesta and Sinoog Festival.'
                : 'Sponsor names and recognition tiers will appear here after committee approval.'
            }
            align="center"
          />
          {sponsors.length > 0 ? (
            <div className="sponsor-strip sponsor-strip--live">
              {sponsors.map((row) => {
                const logo = getSponsorLogoUrl(row.sponsor.logo_path);
                const websiteUrl = row.sponsor.website_url || null;
                const facebookUrl = row.sponsor.facebook_url || null;
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
    </>
  );
}
