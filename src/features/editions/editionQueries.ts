import { supabase } from '../../lib/supabase';
import type { Edition, Json } from '../../types/database';

export const DEFAULT_EDITION: Edition = {
  id: 'current-2027',
  year: 2027,
  name: 'Sinoog 2027',
  parish_name: 'Sto. Niño Parish — Guinacot',
  location: 'Guinacot, Guindulman, Bohol',
  timezone: 'Asia/Manila',
  run_date: '2027-01-09',
  novena_start_date: '2027-01-06',
  fiesta_date: '2027-01-15',
  registration_open: false,
  is_current: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export interface SiteSettingsMap {
  announcement_banner?: {
    enabled: boolean;
    text: string;
    severity?: 'info' | 'warning' | 'alert';
    expires_at?: string;
  };
  contact_info?: {
    email?: string;
    phone?: string;
    office_hours?: string;
    social_fb?: string;
  };
  feature_switches?: {
    registration_enabled?: boolean;
    delegations_enabled?: boolean;
    sponsors_enabled?: boolean;
    gallery_enabled?: boolean;
  };
}

export async function getCurrentEdition(): Promise<Edition> {
  if (!supabase) return DEFAULT_EDITION;

  try {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .eq('is_current', true)
      .maybeSingle();

    if (error || !data) {
      console.warn('Could not fetch current edition from Supabase, using fallback.', error);
      return DEFAULT_EDITION;
    }
    return data as Edition;
  } catch (err) {
    console.warn('Supabase edition fetch error:', err);
    return DEFAULT_EDITION;
  }
}

export async function getSiteSettings(editionId: string): Promise<SiteSettingsMap> {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('edition_id', editionId);

    if (error || !data) {
      return {};
    }

    const settings: SiteSettingsMap = {};
    for (const item of data as Array<{ key: string; value: Json }>) {
      if (item.key === 'announcement_banner') {
        settings.announcement_banner = item.value as unknown as SiteSettingsMap['announcement_banner'];
      } else if (item.key === 'contact_info') {
        settings.contact_info = item.value as unknown as SiteSettingsMap['contact_info'];
      } else if (item.key === 'feature_switches') {
        settings.feature_switches = item.value as unknown as SiteSettingsMap['feature_switches'];
      }
    }
    return settings;
  } catch (err) {
    console.warn('Supabase site settings fetch error:', err);
    return {};
  }
}

export async function updateEdition(
  id: string,
  updates: Partial<Omit<Edition, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: Edition | null; error: Error | null }> {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  const { data, error } = await supabase
    .from('editions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: (data as Edition) ?? null, error: error ? new Error(error.message) : null };
}

export async function saveSiteSetting(
  editionId: string,
  key: string,
  value: Json
): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase client is not configured') };
  }

  const { error } = await supabase.from('site_settings').upsert({
    edition_id: editionId,
    key,
    value,
  });

  return { error: error ? new Error(error.message) : null };
}