import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Share2, AlertCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getPostBySlug } from '../../features/content/postQueries';
import { getPublicMediaUrl } from '../../features/media/mediaQueries';
import { ErrorState, LoadingState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import type { NewsPost } from '../../types';
import { sanitizeArticleHtml } from '../../features/content/sanitizeArticleHtml';

export function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!slug) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      void getPostBySlug(slug).then((item) => {
        if (!active) return;
        setPost(item);
      }).catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load this article.');
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadTimer);
    };
  }, [slug, reloadKey]);

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      void navigator.clipboard.writeText(window.location.href);
      toast('Article link copied to clipboard!', 'info');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <LoadingState message="Loading article details…" />
      </div>
    );
  }

  if (!post) {
    if (loadError) {
      return <article className="article-page"><div className="container narrow"><ErrorState message={loadError} onRetry={() => { setLoading(true); setReloadKey((value) => value + 1); }} /></div></article>;
    }
    return (
      <article className="article-page">
        <div className="container narrow" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <AlertCircle size={48} color="#781d22" style={{ margin: '0 auto 1rem' }} />
          <h1>Article Not Found</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            The requested article or announcement does not exist or has been removed.
          </p>
          <Link to="/news" className="button button--primary">
            <ArrowLeft size={16} /> Return to news
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="article-page">
      <div className="container narrow">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link className="back-link" to="/news" style={{ margin: 0 }}>
            <ArrowLeft size={18} /> Back to news
          </Link>
          <button
            type="button"
            className="button button--ghost"
            onClick={handleShare}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
          >
            <Share2 size={16} /> Share article
          </button>
        </div>

        <span className="activity-type">{post.category}</span>
        <h1>{post.title}</h1>
        <p className="article-meta">
          <CalendarDays size={16} /> {post.publishedAt} · Sto. Niño Parish Sinoog Committee
        </p>

        {post.featuredImagePath ? (
          <div style={{ margin: '2rem 0', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <img
              src={getPublicMediaUrl(post.featuredImagePath)}
              alt={post.title}
              style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className="article-cover" />
        )}

        <div className="prose">
          {post.excerpt && (
            <p style={{ fontSize: '1.2rem', fontWeight: 500, color: '#3d342f', lineHeight: 1.5, marginBottom: '2rem' }}>
              {post.excerpt}
            </p>
          )}

          {post.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(post.bodyHtml) }} />
          ) : (
            <>
              <p>
                Preparations continue for <strong>Sinoog 2027</strong> in Sto. Niño Parish, Guinacot, Guindulman, Bohol.
              </p>
              <h2>Official Advisory</h2>
              <p>
                All participants, devotees, and runners are encouraged to consult official updates published on this website
                and via the parish’s verified announcements.
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
