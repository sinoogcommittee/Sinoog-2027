import { supabase } from '../../lib/supabase';
import type { DbActivity, ActivityType, ContentStatus } from '../../types';

export const FALLBACK_ACTIVITIES: DbActivity[] = [
  {
    id: 'f1',
    edition_id: 'current-2027',
    type: 'run',
    title: 'Sinoog Run 2027',
    description: 'Community run and marathon opening our festivities. Multiple distance categories available.',
    starts_at: '2027-01-09T05:30:00+08:00',
    ends_at: '2027-01-09T09:00:00+08:00',
    venue: 'Guinacot, Guindulman',
    celebrant: null,
    status: 'published',
    sort_order: 1,
    created_by: null,
    updated_by: null,
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:00Z',
  },
  {
    id: 'f2',
    edition_id: 'current-2027',
    type: 'mass',
    title: 'Opening Novena Mass (Day 1)',
    description: 'The first day of the holy novena in honor of Señor Sto. Niño.',
    starts_at: '2027-01-09T17:00:00+08:00',
    ends_at: '2027-01-09T18:30:00+08:00',
    venue: 'Sto. Niño Parish Church, Guinacot',
    celebrant: 'Parish Confirmation Pending',
    status: 'published',
    sort_order: 2,
    created_by: null,
    updated_by: null,
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:00Z',
  },
  {
    id: 'f3',
    edition_id: 'current-2027',
    type: 'mass',
    title: 'Pontifical Concelebrated Mass',
    description: 'Solemn feast day Pontifical Mass celebrating the Fiesta of Señor Sto. Niño.',
    starts_at: '2027-01-15T09:00:00+08:00',
    ends_at: '2027-01-15T11:00:00+08:00',
    venue: 'Sto. Niño Parish Church, Guinacot',
    celebrant: 'Bishop / Concelebrating Priests',
    status: 'published',
    sort_order: 3,
    created_by: null,
    updated_by: null,
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:00Z',
  },
  {
    id: 'f4',
    edition_id: 'current-2027',
    type: 'festival',
    title: 'Sinoog Festival Street Dancing & Ritual Showdown',
    description: 'Annual cultural and religious dance competition featuring parish delegations.',
    starts_at: '2027-01-15T13:30:00+08:00',
    ends_at: '2027-01-15T18:00:00+08:00',
    venue: 'Guinacot Festival Grounds',
    celebrant: null,
    status: 'published',
    sort_order: 4,
    created_by: null,
    updated_by: null,
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:00Z',
  },
];

export async function getPublishedActivities(typeFilter?: ActivityType | 'all'): Promise<DbActivity[]> {
  if (!supabase) {
    if (!typeFilter || typeFilter === 'all') return FALLBACK_ACTIVITIES;
    return FALLBACK_ACTIVITIES.filter((a) => a.type === typeFilter);
  }

  try {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('starts_at', { ascending: true });

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (!typeFilter || typeFilter === 'all') return FALLBACK_ACTIVITIES;
      return FALLBACK_ACTIVITIES.filter((a) => a.type === typeFilter);
    }
    return (data as DbActivity[]) ?? FALLBACK_ACTIVITIES;
  } catch (err) {
    console.warn('Failed to load published activities:', err);
    if (!typeFilter || typeFilter === 'all') return FALLBACK_ACTIVITIES;
    return FALLBACK_ACTIVITIES.filter((a) => a.type === typeFilter);
  }
}

export async function getAllActivitiesForAdmin(): Promise<DbActivity[]> {
  if (!supabase) {
    return FALLBACK_ACTIVITIES;
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Error fetching admin activities:', error);
    throw new Error(error.message);
  }

  return (data as DbActivity[]) ?? [];
}

export interface ActivityInput {
  edition_id: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  venue?: string | null;
  celebrant?: string | null;
  status: ContentStatus;
  sort_order?: number;
}

export async function createActivity(payload: ActivityInput): Promise<DbActivity> {
  if (!supabase) {
    throw new Error('Supabase client is not connected');
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      edition_id: payload.edition_id,
      type: payload.type,
      title: payload.title,
      description: payload.description || null,
      starts_at: payload.starts_at || null,
      ends_at: payload.ends_at || null,
      venue: payload.venue || null,
      celebrant: payload.celebrant || null,
      status: payload.status,
      sort_order: payload.sort_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create activity');
  }

  return data as DbActivity;
}

export async function updateActivity(
  id: string,
  payload: Partial<ActivityInput>
): Promise<DbActivity> {
  if (!supabase) {
    throw new Error('Supabase client is not connected');
  }

  const { data, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update activity');
  }

  return data as DbActivity;
}

export async function deleteActivity(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not connected');
  }

  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export function formatActivityDateTime(isoString: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!isoString) {
    return { date: 'Date TBA', time: 'Time TBA' };
  }

  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { date: 'Date TBA', time: 'Time TBA' };
    }

    const date = d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const time = d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return { date, time };
  } catch {
    return { date: 'Date TBA', time: 'Time TBA' };
  }
}

