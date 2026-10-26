import { useEffect, useState, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Plus, Search, Edit2, Trash2, Globe, Pin, Upload, AlertCircle, X, Check, Eye } from 'lucide-react';
import {
  getAllPostsForAdmin,
  createPost,
  updatePost,
  deletePost,
  slugify,
  type PostInput,
} from '../../features/content/postQueries';
import { uploadPublicImage, getPublicMediaUrl } from '../../features/media/mediaQueries';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, EmptyState, ConfirmDialog } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import type { DbPost, ContentStatus } from '../../types';
import { sanitizeArticleHtml } from '../../features/content/sanitizeArticleHtml';

export function PostsManagerPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editionId, setEditionId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<DbPost | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugAuto, setIsSlugAuto] = useState(true);
  const [category, setCategory] = useState('Announcement');
  const [excerpt, setExcerpt] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [featuredImagePath, setFeaturedImagePath] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [pinned, setPinned] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<DbPost | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const [currentEd, list] = await Promise.all([
        getCurrentEdition(),
        getAllPostsForAdmin(),
      ]);
      setEditionId(currentEd.id);
      setPosts(list);
    } catch (err: unknown) {
      console.error('Failed to load posts:', err);
      toast('Could not fetch articles from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [currentEd, list] = await Promise.all([
          getCurrentEdition(),
          getAllPostsForAdmin(),
        ]);
        if (!mounted) return;
        setEditionId(currentEd.id);
        setPosts(list);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error('Failed to load posts:', err);
        toast('Could not fetch articles from database.', 'error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setIsSlugAuto(true);
    setCategory('Announcement');
    setExcerpt('');
    setBodyHtml('<p>Write article content here…</p>');
    setFeaturedImagePath('');
    setStatus('published');
    setPinned(false);
    setActiveTab('edit');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: DbPost) => {
    setEditingPost(p);
    setTitle(p.title);
    setSlug(p.slug);
    setIsSlugAuto(false);
    setCategory(p.category);
    setExcerpt(p.excerpt || '');
    setBodyHtml(p.body_html || '');
    setFeaturedImagePath(p.featured_image_path || '');
    setStatus(p.status);
    setPinned(p.pinned);
    setActiveTab('edit');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isSlugAuto) {
      setSlug(slugify(val));
    }
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const res = await uploadPublicImage(file, {
        editionId,
        folder: 'news-covers',
        title: title || file.name,
      });
      setFeaturedImagePath(res.objectPath);
      toast('Featured image uploaded successfully.', 'success');
    } catch (err: unknown) {
      console.error('Image upload failed:', err);
      toast(err instanceof Error ? err.message : 'Image upload failed.', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter an article title.');
      return;
    }
    if (!slug.trim()) {
      setFormError('Please enter or generate a unique slug.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload: PostInput = {
        edition_id: editionId || 'current-2027',
        slug: slug.trim(),
        title: title.trim(),
        category,
        excerpt: excerpt.trim() || null,
        body_html: bodyHtml.trim(),
        featured_image_path: featuredImagePath.trim() || null,
        status,
        pinned,
      };

      if (editingPost) {
        await updatePost(editingPost.id, payload);
        toast(`Article "${payload.title}" updated successfully.`, 'success');
      } else {
        await createPost(payload);
        toast(`Article "${payload.title}" published/saved successfully.`, 'success');
      }

      setIsModalOpen(false);
      await fetchPosts();
    } catch (err: unknown) {
      console.error('Error saving post:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save post.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (post: DbPost) => {
    const nextStatus: ContentStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await updatePost(post.id, { status: nextStatus });
      toast(`Marked "${post.title}" as ${nextStatus}.`, 'success');
      await fetchPosts();
    } catch (err: unknown) {
      console.error('Error updating status:', err);
      toast('Failed to change article status.', 'error');
    }
  };

  const handleTogglePinned = async (post: DbPost) => {
    try {
      await updatePost(post.id, { pinned: !post.pinned });
      toast(post.pinned ? `Unpinned "${post.title}".` : `Pinned "${post.title}" to top.`, 'info');
      await fetchPosts();
    } catch (err: unknown) {
      console.error('Error pinning post:', err);
      toast('Failed to update pinned state.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id);
      toast(`Deleted "${deleteTarget.title}".`, 'info');
      setDeleteTarget(null);
      await fetchPosts();
    } catch (err: unknown) {
      console.error('Failed to delete post:', err);
      toast('Failed to delete post.', 'error');
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [posts, searchQuery, statusFilter, categoryFilter]);

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">News & Announcements CMS</p>
          <h1>Articles & Notices</h1>
          <p>Draft, publish, and manage official bulletins for Sinoog 2027.</p>
        </div>
        <button type="button" className="button button--primary" onClick={openCreateModal}>
          <Plus size={18} /> Create announcement
        </button>
      </div>

      <section className="admin-panel">
        <div className="table-tools" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <label style={{ flex: '1 1 240px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search announcements…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
            >
              <option value="all">All Categories</option>
              <option value="Announcement">Announcement</option>
              <option value="Sinoog Run">Sinoog Run</option>
              <option value="Festival">Festival</option>
              <option value="Parish">Parish</option>
              <option value="Advisory">Advisory</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem' }}>
            <LoadingState message="Loading articles…" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            title="No articles found"
            message={
              searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search query or filters.'
                : 'Get started by publishing the first official notice.'
            }
            action={
              <button type="button" className="button button--secondary" onClick={openCreateModal}>
                <Plus size={16} /> Create announcement
              </button>
            }
          />
        ) : (
          <div className="admin-table">
            <div className="admin-table__head" style={{ gridTemplateColumns: '2.5fr 1fr 1fr 100px 140px' }}>
              <span>Title & Slug</span>
              <span>Category</span>
              <span>Published / Updated</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="admin-table__row posts-table__row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1fr 1fr 100px 140px',
                  padding: '1rem',
                  borderBottom: '1px solid #ede4dc',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {post.pinned && <Pin size={14} color="#d69d2e" fill="#d69d2e" />}
                    <strong style={{ fontSize: '1.05rem', color: '#3d1214' }}>{post.title}</strong>
                  </div>
                  <small style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>
                    /news/{post.slug}
                  </small>
                </div>

                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#f5efe6',
                      color: '#634b35',
                    }}
                  >
                    {post.category}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#6d6158' }}>
                  {post.published_at ? (
                    new Date(post.published_at).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Manila',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  ) : (
                    <span>Not published</span>
                  )}
                </div>

                <div>
                  <StatusBadge tone={post.status === 'published' ? 'success' : post.status === 'draft' ? 'warning' : 'neutral'}>
                    {post.status}
                  </StatusBadge>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button button--ghost"
                    style={{ padding: '0.35rem' }}
                    title={post.pinned ? 'Unpin post' : 'Pin post to top'}
                    onClick={() => void handleTogglePinned(post)}
                  >
                    <Pin size={16} color={post.pinned ? '#d69d2e' : '#aaa'} fill={post.pinned ? '#d69d2e' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    style={{ padding: '0.35rem' }}
                    title={post.status === 'published' ? 'Unpublish (make draft)' : 'Publish to live website'}
                    onClick={() => void handleToggleStatus(post)}
                  >
                    <Globe size={16} color={post.status === 'published' ? '#1b7340' : '#888'} />
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    style={{ padding: '0.35rem' }}
                    title="Edit article"
                    onClick={() => openEditModal(post)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    style={{ padding: '0.35rem', color: '#c53030' }}
                    title="Delete article"
                    onClick={() => setDeleteTarget(post)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="post-modal-title">
          <div className="modal-card" style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 id="post-modal-title" style={{ fontSize: '1.4rem', margin: 0 }}>
                  {editingPost ? 'Edit Announcement' : 'Create New Announcement'}
                </h2>
                <small style={{ color: '#888' }}>
                  Authorized News & Parish Communication CMS
                </small>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`button button--sm ${activeTab === 'edit' ? 'button--primary' : 'button--ghost'}`}
                onClick={() => setActiveTab('edit')}
              >
                <Edit2 size={14} /> Article Editor
              </button>
              <button
                type="button"
                className={`button button--sm ${activeTab === 'preview' ? 'button--primary' : 'button--ghost'}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye size={14} /> Live Preview
              </button>
            </div>

            {activeTab === 'preview' ? (
              <div style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#faf8f5', marginBottom: '1.5rem' }}>
                <span className="activity-type" style={{ marginBottom: '0.5rem' }}>{category}</span>
                <h1 style={{ fontSize: '2rem', fontFamily: 'Fraunces, serif', margin: '0.5rem 0' }}>
                  {title || 'Untitled Article'}
                </h1>
                {excerpt && <p style={{ fontSize: '1.1rem', color: '#555', fontStyle: 'italic', marginBottom: '1.5rem' }}>{excerpt}</p>}
                {featuredImagePath && (
                  <div style={{ marginBottom: '1.5rem', borderRadius: '6px', overflow: 'hidden' }}>
                    <img
                      src={getPublicMediaUrl(featuredImagePath)}
                      alt="Featured visual"
                      style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(bodyHtml || '<p>No content written yet.</p>') }} />
              </div>
            ) : (
              <form onSubmit={(e) => void handleFormSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Article Title <span style={{ color: '#c53030' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schedule of Novena Masses Announced"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>

                <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      URL Slug <span style={{ color: '#c53030' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="schedule-of-novena-masses"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setIsSlugAuto(false);
                      }}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    />
                    <small style={{ color: '#888', fontSize: '0.78rem' }}>Public URL: /news/{slug || '...'}</small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    >
                      <option value="Announcement">Announcement</option>
                      <option value="Sinoog Run">Sinoog Run</option>
                      <option value="Festival">Festival</option>
                      <option value="Parish">Parish</option>
                      <option value="Advisory">Advisory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Summary / Excerpt
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief 1-2 sentence lead appearing in news cards and search results…"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Featured Image (Cover)
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label className="button button--secondary button--sm" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> {imageUploading ? 'Uploading image…' : 'Upload image (JPEG/PNG/WebP)'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => void handleImageFileChange(e)}
                        disabled={imageUploading}
                      />
                    </label>
                    {featuredImagePath && (
                      <span style={{ fontSize: '0.85rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check size={14} /> Image selected
                      </span>
                    )}
                  </div>
                  {featuredImagePath && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={getPublicMediaUrl(featuredImagePath)}
                        alt="Cover thumbnail"
                        style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        style={{ color: '#c53030' }}
                        onClick={() => setFeaturedImagePath('')}
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Article Body (HTML / Prose)
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="<p>Full article body with paragraphs and formatting…</p>"
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.88rem', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>

                <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', background: '#faf8f4', padding: '0.75rem', borderRadius: '6px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      Publication Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ContentStatus)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    >
                      <option value="published">Published (Live to public)</option>
                      <option value="draft">Draft (Visible only to news staff)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={pinned}
                        onChange={(e) => setPinned(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pin to top of news list</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setIsModalOpen(false)}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={formSubmitting}
                  >
                    <Check size={16} /> {formSubmitting ? 'Saving…' : editingPost ? 'Save changes' : 'Publish announcement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This permanently removes the announcement from the website and database.`}
        confirmLabel="Yes, delete announcement"
        tone="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
