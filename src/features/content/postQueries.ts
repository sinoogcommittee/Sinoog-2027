import { supabase } from '../../lib/supabase';
import type { DbPost, ContentStatus, NewsPost } from '../../types';

export const FALLBACK_POSTS: NewsPost[] = [
  {
    id: 'f-post-1',
    slug: 'welcome-to-sinoog-2027',
    title: 'Welcome to Sinoog 2027: Preparations Underway',
    excerpt: 'Preparations have officially begun for our parish fiesta and festival celebration in Sto. Niño Parish, Guinacot.',
    category: 'Announcement',
    publishedAt: 'October 26, 2026',
    pinned: true,
    bodyHtml: `<p>Sto. Niño Parish in Guinacot, Guindulman, Bohol warmly welcomes all parishioners, devotees, and guests to the preparation period for <strong>Sinoog 2027</strong>.</p><p>As we honor our beloved patron Señor Sto. Niño, this official website serves as the central hub for verified festival schedules, Holy Mass timings, delegation guidelines, and Sinoog Run registration information.</p>`,
  },
  {
    id: 'f-post-2',
    slug: 'run-details-coming-soon',
    title: 'Sinoog Run 2027: Details and Categories Coming Soon',
    excerpt: 'Distance categories, routes, registration windows, and runner kit information are being finalized by the organizing committee.',
    category: 'Sinoog Run',
    publishedAt: 'October 26, 2026',
    pinned: false,
    bodyHtml: `<p>The Sinoog Run 2027 is slated to kick off our festival week on <strong>January 9, 2027</strong>. Our technical committee is coordinating routes and safety precautions.</p><p>Official registration dates, fees, and category distances will be announced once finalized. Stay tuned!</p>`,
  },
  {
    id: 'f-post-3',
    slug: 'delegation-guidelines',
    title: 'Festival Delegation Guidelines in Preparation',
    excerpt: 'Delegation heads will receive access to the official submission portal for private rosters and music.',
    category: 'Festival',
    publishedAt: 'October 26, 2026',
    pinned: false,
    bodyHtml: `<p>Contingents and delegations preparing for the Sinoog Festival 2027 Street Dancing and Ritual Showdown will be provided with full participation guidelines.</p><p>Heads of delegations will soon be given secure portal credentials to manage participant rosters and upload performance tracks directly.</p>`,
  },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getPublishedPosts(category?: string, searchTerm?: string): Promise<NewsPost[]> {
  if (!supabase) {
    let list = FALLBACK_POSTS;
    if (category && category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(term) || p.excerpt.toLowerCase().includes(term));
    }
    return list;
  }

  try {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let list = FALLBACK_POSTS;
      if (category && category !== 'All') {
        list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }
      return list;
    }

    const rows = data as DbPost[];
    return rows.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt || '',
      category: d.category,
      publishedAt: d.published_at
        ? new Date(d.published_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'Asia/Manila',
          })
        : new Date(d.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'Asia/Manila',
          }),
      bodyHtml: d.body_html,
      featuredImagePath: d.featured_image_path,
      pinned: d.pinned,
    }));
  } catch (err) {
    console.warn('Failed to load published posts:', err);
    return FALLBACK_POSTS;
  }
}

export async function getPostBySlug(slug: string): Promise<NewsPost | null> {
  if (!supabase) {
    return FALLBACK_POSTS.find((p) => p.slug === slug) ?? null;
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      return FALLBACK_POSTS.find((p) => p.slug === slug) ?? null;
    }

    const d = data as DbPost;
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt || '',
      category: d.category,
      publishedAt: d.published_at
        ? new Date(d.published_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'Asia/Manila',
          })
        : new Date(d.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'Asia/Manila',
          }),
      bodyHtml: d.body_html,
      featuredImagePath: d.featured_image_path,
      pinned: d.pinned,
    };
  } catch (err) {
    console.warn('Failed to load post by slug:', err);
    return FALLBACK_POSTS.find((p) => p.slug === slug) ?? null;
  }
}

export async function getAllPostsForAdmin(): Promise<DbPost[]> {
  if (!supabase) {
    return FALLBACK_POSTS.map((f) => ({
      id: f.id,
      edition_id: 'current-2027',
      slug: f.slug,
      title: f.title,
      excerpt: f.excerpt,
      body_html: f.bodyHtml || '',
      category: f.category,
      featured_image_path: f.featuredImagePath || null,
      status: 'published' as ContentStatus,
      pinned: Boolean(f.pinned),
      published_at: '2026-10-26T00:00:00Z',
      created_by: null,
      updated_by: null,
      created_at: '2026-10-26T00:00:00Z',
      updated_at: '2026-10-26T00:00:00Z',
    }));
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbPost[]) ?? [];
}

export interface PostInput {
  edition_id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  body_html: string;
  category: string;
  featured_image_path?: string | null;
  status: ContentStatus;
  pinned: boolean;
  published_at?: string | null;
}

export async function createPost(payload: PostInput): Promise<DbPost> {
  if (!supabase) {
    throw new Error('Supabase client is not connected');
  }

  // Check duplicate slug in same edition
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('edition_id', payload.edition_id)
    .eq('slug', payload.slug)
    .maybeSingle();

  if (existing) {
    throw new Error(`An article with the slug "${payload.slug}" already exists. Please customize the slug.`);
  }

  const publishedAt =
    payload.status === 'published'
      ? payload.published_at || new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from('posts')
    .insert({
      edition_id: payload.edition_id,
      slug: payload.slug,
      title: payload.title,
      excerpt: payload.excerpt || null,
      body_html: payload.body_html,
      category: payload.category,
      featured_image_path: payload.featured_image_path || null,
      status: payload.status,
      pinned: payload.pinned,
      published_at: publishedAt,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create post');
  }

  return data as DbPost;
}

export async function updatePost(id: string, payload: Partial<PostInput>): Promise<DbPost> {
  if (!supabase) {
    throw new Error('Supabase client is not connected');
  }

  // If changing status to published and published_at is not set, set it now
  const updates: Partial<PostInput> = { ...payload };
  if (updates.status === 'published' && !updates.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update post');
  }

  return data as DbPost;
}

export async function deletePost(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not connected');
  }

  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}
