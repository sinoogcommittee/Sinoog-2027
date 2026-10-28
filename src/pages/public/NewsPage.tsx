import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Pin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHero } from '../../components/PageHero';
import { getPublishedPosts } from '../../features/content/postQueries';
import { EmptyState, ErrorState, LoadingState } from '../../features/ui/FeedbackStates';
import type { NewsPost } from '../../types';

const CATEGORIES = ['All', 'Announcement', 'Sinoog Run', 'Festival'] as const;

function dateBadge(publishedAt: string): { day: string; month: string } {
  // Expects formats like "October 26, 2026" from the API layer
  const parsed = new Date(publishedAt);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      day: String(parsed.getDate()).padStart(2, '0'),
      month: parsed.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    };
  }
  const parts = publishedAt.split(' ');
  return {
    day: (parts[1] ?? '—').replace(',', ''),
    month: (parts[0] ?? 'OCT').slice(0, 3).toUpperCase(),
  };
}

function PostCard({ post, featured = false }: { post: NewsPost; featured?: boolean }) {
  const badge = dateBadge(post.publishedAt);

  return (
    <article className={`news-feed-card${featured ? ' news-feed-card--featured' : ''}`}>
      <div className="news-feed-card__date" aria-hidden>
        <strong>{badge.day}</strong>
        <span>{badge.month}</span>
      </div>
      <div className="news-feed-card__body">
        <div className="news-feed-card__tags">
          <span className="activity-type">{post.category}</span>
          {post.pinned && (
            <span className="news-pinned-tag">
              <Pin size={12} aria-hidden /> Pinned
            </span>
          )}
        </div>
        <h2 className="news-feed-card__title">
          <Link to={`/news/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="news-feed-card__excerpt">{post.excerpt}</p>}
        <Link to={`/news/${post.slug}`} className="news-feed-card__read">
          Read story <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoadError(null);
      void getPublishedPosts(selectedCategory, searchTerm)
        .then((list) => {
          if (!active) return;
          setPosts(list);
        })
        .catch((error: unknown) => {
          if (active) {
            setLoadError(error instanceof Error ? error.message : 'Unable to load published news.');
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchTerm, selectedCategory, reloadKey]);

  const { featured, rest } = useMemo(() => {
    const pinned = posts.find((p) => p.pinned);
    if (!pinned) return { featured: null as NewsPost | null, rest: posts };
    return { featured: pinned, rest: posts.filter((p) => p.id !== pinned.id) };
  }, [posts]);

  return (
    <>
      <PageHero
        eyebrow="Official updates"
        title="News & announcements"
        description="The latest official statements, advisories, and press releases from the Sinoog Committee and Sto. Niño Parish."
      />

      <section className="section">
        <div className="container">
          <div className="public-filter-bar public-filter-bar--news">
            <label className="search-field modern-search public-filter-search" htmlFor="news-search-input">
              <Search size={18} aria-hidden />
              <input
                id="news-search-input"
                type="search"
                aria-label="Search announcements"
                placeholder="Search announcements…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setLoading(true);
                }}
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>

            <div className="public-filter-tabs public-filter-tabs--news" role="group" aria-label="Filter by category">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={selectedCategory === cat ? 'is-active' : ''}
                  aria-pressed={selectedCategory === cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setLoading(true);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0' }}>
              <LoadingState message="Loading articles and notices…" />
            </div>
          ) : loadError ? (
            <ErrorState
              message={loadError}
              onRetry={() => {
                setLoading(true);
                setReloadKey((value) => value + 1);
              }}
            />
          ) : posts.length > 0 ? (
            <div className="news-feed">
              {featured && (
                <div className="news-feed__featured" aria-label="Pinned announcement">
                  <PostCard post={featured} featured />
                </div>
              )}
              <div className="news-feed__list">
                {rest.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No announcements found"
              message={
                searchTerm || selectedCategory !== 'All'
                  ? 'No articles matched your search or filter. Try different keywords or choose All.'
                  : 'Official announcements will appear here once the committee publishes them.'
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
