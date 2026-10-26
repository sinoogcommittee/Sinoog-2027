import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, MapPin, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { SectionHeading } from '../../components/SectionHeading';
import { LogoMark } from '../../components/LogoMark';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { getPublishedActivities, formatActivityDateTime } from '../../features/activities/activityQueries';
import { getPublishedPosts } from '../../features/content/postQueries';
import { getPublicMediaUrl } from '../../features/media/mediaQueries';
import type { DbActivity, NewsPost } from '../../types';

export function HomePage() {
  const [activitiesList, setActivitiesList] = useState<DbActivity[]>([]);
  const [newsList, setNewsList] = useState<NewsPost[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getCurrentEdition(),
      getPublishedActivities(),
      getPublishedPosts(),
    ]).then(([, acts, posts]) => {
      if (!active) return;
      setActivitiesList(acts.slice(0, 4));
      setNewsList(posts.slice(0, 3));
    });

    return () => {
      active = false;
    };
  }, []);

  const celebrationKeyDates = [
    { date: 'January 9, 2027', label: 'Sinoog Run', note: 'Opening event · Registration details coming soon' },
    { date: 'January 9, 2027', label: 'Novena begins', note: 'Mass schedule awaiting final parish confirmation' },
    { date: 'January 15, 2027', label: 'Fiesta & Sinoog Festival', note: 'Guinacot, Guindulman, Bohol' },
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
            <div className="hero-official-mark">
              <LogoMark type="committee" />
            </div>
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
            {activitiesList.map((a) => {
              const dt = formatActivityDateTime(a.starts_at);
              const dayStr = a.starts_at ? new Date(a.starts_at).getDate().toString().padStart(2, '0') : '09';
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
            {newsList.map((post, i) => (
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
            description="Sponsor names and recognition tiers will appear here after committee approval."
            align="center"
          />
          <div className="sponsor-strip">
            <span>MAJOR PARTNER</span>
            <span>COMMUNITY PARTNER</span>
            <span>MEDIA PARTNER</span>
            <span>SUPPORTER</span>
          </div>
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
