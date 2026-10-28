import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Facebook, Share2, AlertCircle } from 'lucide-react';
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
    if (!slug) return;

    const loadTimer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      void getPostBySlug(slug)
        .then((item) => {
          if (!active) return;
          setPost(item);
        })
        .catch((error: unknown) => {
          if (active) {
            setLoadError(error instanceof Error ? error.message : 'Unable to load this article.');
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
  }, [slug, reloadKey]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleNativeShare = () => {
    if (navigator.share) {
      void navigator
        .share({
          title: post?.title,
          text: post?.excerpt,
          url: pageUrl,
        })
        .catch(() => {});
    } else {
      void navigator.clipboard.writeText(pageUrl);
      toast('Article link copied to clipboard!', 'info');
    }
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(pageUrl);
    toast('Article link copied to clipboard!', 'info');
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
      return (
        <article className="article-page">
          <div className="container narrow">
            <ErrorState
              message={loadError}
              onRetry={() => {
                setLoading(true);
                setReloadKey((value) => value + 1);
              }}
            />
          </div>
        </article>
      );
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

  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
  const messengerShare = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(pageUrl)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(pageUrl)}`;

  return (
    <article className="article-page">
      <div className="container narrow">
        <div className="article-page__toolbar">
          <Link className="back-link" to="/news">
            <ArrowLeft size={18} /> Back to news
          </Link>
          <button type="button" className="button button--ghost button--sm" onClick={handleNativeShare}>
            <Share2 size={16} /> Share
          </button>
        </div>

        <span className="activity-type">{post.category}</span>
        {post.pinned && <span className="news-pinned-tag" style={{ marginLeft: 8 }}>Pinned</span>}
        <h1>{post.title}</h1>
        <p className="article-meta">
          <CalendarDays size={16} /> {post.publishedAt} · Sto. Niño Parish Sinoog Committee
        </p>

        {post.featuredImagePath ? (
          <div className="article-page__cover">
            <img src={getPublicMediaUrl(post.featuredImagePath)} alt="" />
          </div>
        ) : (
          <div className="article-cover" />
        )}

        <div className="prose">
          {post.excerpt && <p className="article-page__lede">{post.excerpt}</p>}

          {post.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(post.bodyHtml) }} />
          ) : (
            <p>
              Preparations continue for <strong>Sinoog 2027</strong> in Sto. Niño Parish, Guinacot, Guindulman, Bohol.
            </p>
          )}
        </div>

        <div className="article-share">
          <p className="article-share__label">Share this announcement</p>
          <div className="article-share__buttons">
            <a
              href={facebookShare}
              target="_blank"
              rel="noreferrer"
              className="article-share__btn article-share__btn--fb"
            >
              <Facebook size={16} aria-hidden /> Facebook
            </a>
            <a
              href={messengerShare}
              target="_blank"
              rel="noreferrer"
              className="article-share__btn article-share__btn--msg"
            >
              Messenger
            </a>
            <button type="button" className="article-share__btn" onClick={handleCopyLink}>
              <Share2 size={16} aria-hidden /> Copy link
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
