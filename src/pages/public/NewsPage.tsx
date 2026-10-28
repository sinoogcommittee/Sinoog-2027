import { useEffect, useState } from 'react';
import { ArrowRight, Search, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHero } from '../../components/PageHero';
import { getPublishedPosts } from '../../features/content/postQueries';
import { ErrorState, LoadingState } from '../../features/ui/FeedbackStates';
import type { NewsPost } from '../../types';

export function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const categories = ['All', 'Announcement', 'Sinoog Run', 'Festival'];

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      setLoadError(null);
      void getPublishedPosts(selectedCategory, searchTerm).then((list) => {
        if (!active) return;
        setPosts(list);
      }).catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load published news.');
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedCategory, reloadKey]);

  return (
    <>
      <PageHero
        eyebrow="Official updates"
        title="News & announcements"
        description="The latest official statements, advisories, and press releases from the Sinoog Committee and Sto. Niño Parish."
      />

      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
            }}
          >
            <label className="search-field modern-search" htmlFor="news-search-input" style={{ flex: '1 1 300px' }}>
              <Search size={18} aria-hidden="true" />
              <input
                id="news-search-input"
                type="search"
                aria-label="Search news"
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

            <div className="filter-pills" style={{ margin: 0 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={selectedCategory === cat ? 'active' : ''}
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
            <ErrorState message={loadError} onRetry={() => { setLoading(true); setReloadKey((value) => value + 1); }} />
          ) : posts.length > 0 ? (
            <div className="article-list">
              {posts.map((post) => {
                const parts = post.publishedAt.split(' ');
                const day = parts[1]?.replace(',', '') || '26';
                const month = parts[0]?.slice(0, 3).toUpperCase() || 'OCT';
                return (
                  <Link to={`/news/${post.slug}`} key={post.id}>
                    <div className="article-list__date">
                      <strong>{day}</strong>
                      <span>{month}</span>
                    </div>
                    <div>
                      <span className="activity-type">{post.category}</span>
                      <h2>{post.title}</h2>
                      <p>{post.excerpt}</p>
                    </div>
                    <ArrowRight size={20} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Newspaper size={42} />
              <h3>No announcements found</h3>
              <p>No articles matched your search query. Try searching with different keywords.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
