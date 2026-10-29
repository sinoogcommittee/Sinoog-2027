import { useEffect, useState, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Plus, Edit2, Trash2, Globe, Pin, Upload, Check, Eye } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { TextArea } from '../../components/m3/TextArea';
import { Checkbox } from '../../components/m3/Checkbox';
import { SearchBar } from '../../components/m3/SearchBar';
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
import { LoadingState, EmptyState, ConfirmDialog, InlineMessage } from '../../features/ui/FeedbackStates';
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
    <div className="m3-posts-manager admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">News & Announcements CMS</p>
          <h1>Articles & Notices</h1>
          <p>Draft, publish, and manage official bulletins for Sinoog 2027.</p>
        </div>
        <Button type="button" variant="filled" leadingIcon={<Plus size={18} aria-hidden />} onClick={openCreateModal}>
          Create announcement
        </Button>
      </div>

      <Card as="section" variant="outlined" className="admin-panel">
        <div className="table-tools admin-toolbar">
          <SearchBar
            label="Search announcements"
            placeholder="Search announcements…"
            value={searchQuery}
            onValueChange={setSearchQuery}
            fieldClassName="table-tools-search"
          />

          <div className="table-tools-filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
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
              <Button type="button" variant="outlined" leadingIcon={<Plus size={16} aria-hidden />} onClick={openCreateModal}>
                Create announcement
              </Button>
            }
          />
        ) : (
          <div className="admin-table posts-admin-table">
            <div className="admin-table__head posts-table__grid posts-table__head">
              <span>Title & Slug</span>
              <span>Category</span>
              <span>Published</span>
              <span>Status</span>
              <span className="posts-table__actions-label">Actions</span>
            </div>

            {filteredPosts.map((post) => (
              <div key={post.id} className="posts-table__grid posts-table__row">
                <div className="posts-table__cell posts-table__title">
                  <div className="posts-table__title-row">
                    {post.pinned && (
                      <Pin size={14} color="#d69d2e" fill="#d69d2e" aria-label="Pinned" />
                    )}
                    <strong>{post.title}</strong>
                  </div>
                  <small>/news/{post.slug}</small>
                </div>

                <div className="posts-table__cell posts-table__category">
                  <span className="posts-table__category-pill">{post.category}</span>
                </div>

                <div className="posts-table__cell posts-table__date">
                  {post.published_at ? (
                    new Date(post.published_at).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Manila',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  ) : (
                    <span className="posts-table__unpublished">Not published</span>
                  )}
                </div>

                <div className="posts-table__cell posts-table__status">
                  <StatusBadge
                    tone={
                      post.status === 'published'
                        ? 'success'
                        : post.status === 'draft'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {post.status}
                  </StatusBadge>
                </div>

                <div className="posts-table__cell posts-table__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    title={post.pinned ? 'Unpin post' : 'Pin post to top'}
                    onClick={() => void handleTogglePinned(post)}
                  >
                    <Pin
                      size={16}
                      color={post.pinned ? '#d69d2e' : '#aaa'}
                      fill={post.pinned ? '#d69d2e' : 'none'}
                    />
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    title={
                      post.status === 'published'
                        ? 'Unpublish (make draft)'
                        : 'Publish to live website'
                    }
                    onClick={() => void handleToggleStatus(post)}
                  >
                    <Globe size={16} color={post.status === 'published' ? '#1b7340' : '#888'} />
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    title="Edit article"
                    onClick={() => openEditModal(post)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="button button--ghost posts-table__delete"
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
      </Card>

      {/* Editor Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPost ? 'Edit Announcement' : 'Create New Announcement'}
      >
        {formError && (
          <div style={{ marginBottom: '1rem' }}>
            <InlineMessage tone="error">
              {formError}
            </InlineMessage>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <Button
            type="button"
            variant={activeTab === 'edit' ? 'filled' : 'outlined'}
            size="small"
            leadingIcon={<Edit2 size={14} aria-hidden />}
            onClick={() => setActiveTab('edit')}
          >
            Article Editor
          </Button>
          <Button
            type="button"
            variant={activeTab === 'preview' ? 'filled' : 'outlined'}
            size="small"
            leadingIcon={<Eye size={14} aria-hidden />}
            onClick={() => setActiveTab('preview')}
          >
            Live Preview
          </Button>
        </div>

        {activeTab === 'preview' ? (
          <div style={{ padding: '1.25rem', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-medium)', backgroundColor: 'var(--md-sys-color-surface-container-low)', marginBottom: '1.5rem' }}>
            <span className="activity-type" style={{ marginBottom: '0.5rem' }}>{category}</span>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--md-ref-typeface-brand)', margin: '0.5rem 0' }}>
              {title || 'Untitled Article'}
            </h1>
            {excerpt && <p style={{ fontSize: '1.1rem', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', marginBottom: '1.5rem' }}>{excerpt}</p>}
            {featuredImagePath && (
              <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--md-sys-shape-corner-medium)', overflow: 'hidden' }}>
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
            <TextField
              label="Article Title *"
              required
              placeholder="e.g. Schedule of Novena Masses Announced"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />

            <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <TextField
                label="URL Slug *"
                required
                placeholder="schedule-of-novena-masses"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugAuto(false);
                }}
                helperText={`Public URL: /news/${slug || '...'}`}
              />

              <SelectField
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Announcement">Announcement</option>
                <option value="Sinoog Run">Sinoog Run</option>
                <option value="Festival">Festival</option>
                <option value="Parish">Parish</option>
                <option value="Advisory">Advisory</option>
              </SelectField>
            </div>

            <TextArea
              label="Summary / Excerpt"
              rows={2}
              placeholder="Brief 1-2 sentence lead appearing in news cards and search results…"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: 'var(--md-sys-typescale-label-large-size)' }}>
                Featured Image (Cover)
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label className="m3-button m3-button--outlined m3-button--small" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={14} aria-hidden /> {imageUploading ? 'Uploading image…' : 'Upload image (JPEG/PNG/WebP)'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => void handleImageFileChange(e)}
                    disabled={imageUploading}
                  />
                </label>
                {featuredImagePath && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--md-ext-color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Check size={14} /> Image selected
                  </span>
                )}
              </div>
              {featuredImagePath && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={getPublicMediaUrl(featuredImagePath)}
                    alt="Cover thumbnail"
                    style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--md-sys-color-outline-variant)' }}
                  />
                  <Button
                    type="button"
                    variant="text"
                    size="small"
                    onClick={() => setFeaturedImagePath('')}
                  >
                    Remove image
                  </Button>
                </div>
              )}
            </div>

            <TextArea
              label="Article Body (HTML / Prose) *"
              rows={8}
              required
              placeholder="<p>Full article body with paragraphs and formatting…</p>"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="article-body-editor"
            />

            <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', background: 'var(--md-sys-color-surface-container-low)', padding: '0.75rem', borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
              <SelectField
                label="Publication Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
              >
                <option value="published">Published (Live to public)</option>
                <option value="draft">Draft (Visible only to news staff)</option>
                <option value="archived">Archived</option>
              </SelectField>

              <div style={{ paddingTop: '1.25rem' }}>
                <Checkbox
                  label="Pin to top of news list"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button
                type="button"
                variant="text"
                onClick={() => setIsModalOpen(false)}
                disabled={formSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                disabled={formSubmitting}
                loading={formSubmitting}
                leadingIcon={<Check size={16} aria-hidden />}
              >
                {editingPost ? 'Save changes' : 'Publish announcement'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

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
