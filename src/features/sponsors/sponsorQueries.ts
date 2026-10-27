import { supabase } from '../../lib/supabase';
import { getCurrentEdition } from '../editions/editionQueries';
import { getPublicMediaUrl, uploadPublicImage } from '../media/mediaQueries';
import type { DbSponsor } from '../../types';

export const SPONSOR_TIERS = [
  'Presenting',
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'Partner',
  'Media',
  'Supporter',
] as const;

export type SponsorTier = (typeof SPONSOR_TIERS)[number] | string;

export interface EditionSponsorRow {
  edition_id: string;
  sponsor_id: string;
  tier: string;
  sort_order: number;
  published: boolean;
  sponsor: DbSponsor;
}

export interface SponsorInput {
  name: string;
  website_url: string | null;
  logo_path: string | null;
  tier: string;
  sort_order: number;
  published: boolean;
}

function logoUrl(path: string | null | undefined): string {
  if (!path) return '';
  return getPublicMediaUrl(path);
}

export function getSponsorLogoUrl(path: string | null | undefined): string {
  return logoUrl(path);
}

export async function listEditionSponsorsForAdmin(editionId?: string): Promise<EditionSponsorRow[]> {
  const edId = editionId || (await getCurrentEdition()).id;

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('edition_sponsors')
    .select('edition_id, sponsor_id, tier, sort_order, published, sponsor:sponsors(*)')
    .eq('edition_id', edId)
    .order('sort_order', { ascending: true })
    .order('tier', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const sponsorRaw = row.sponsor as unknown;
    const sponsor = (Array.isArray(sponsorRaw) ? sponsorRaw[0] : sponsorRaw) as DbSponsor;
    return {
      edition_id: row.edition_id as string,
      sponsor_id: row.sponsor_id as string,
      tier: row.tier as string,
      sort_order: row.sort_order as number,
      published: row.published as boolean,
      sponsor,
    };
  });
}

export async function listPublishedEditionSponsors(editionId?: string): Promise<EditionSponsorRow[]> {
  const edId = editionId || (await getCurrentEdition()).id;

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('edition_sponsors')
    .select('edition_id, sponsor_id, tier, sort_order, published, sponsor:sponsors(*)')
    .eq('edition_id', edId)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('tier', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const sponsorRaw = row.sponsor as unknown;
    const sponsor = (Array.isArray(sponsorRaw) ? sponsorRaw[0] : sponsorRaw) as DbSponsor;
    return {
      edition_id: row.edition_id as string,
      sponsor_id: row.sponsor_id as string,
      tier: row.tier as string,
      sort_order: row.sort_order as number,
      published: row.published as boolean,
      sponsor,
    };
  });
}

export async function createEditionSponsor(input: SponsorInput, editionId?: string): Promise<EditionSponsorRow> {
  const edId = editionId || (await getCurrentEdition()).id;
  const name = input.name.trim();
  if (!name) throw new Error('Sponsor name is required.');

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: sponsor, error: sponsorError } = await supabase
    .from('sponsors')
    .insert({
      name,
      website_url: input.website_url?.trim() || null,
      logo_path: input.logo_path || null,
    })
    .select('*')
    .single();

  if (sponsorError || !sponsor) {
    throw new Error(sponsorError?.message || 'Unable to create sponsor.');
  }

  const { data: link, error: linkError } = await supabase
    .from('edition_sponsors')
    .insert({
      edition_id: edId,
      sponsor_id: sponsor.id,
      tier: input.tier.trim() || 'Supporter',
      sort_order: input.sort_order,
      published: input.published,
    })
    .select('edition_id, sponsor_id, tier, sort_order, published')
    .single();

  if (linkError || !link) {
    await supabase.from('sponsors').delete().eq('id', sponsor.id);
    throw new Error(linkError?.message || 'Unable to link sponsor to this edition.');
  }

  return {
    edition_id: link.edition_id,
    sponsor_id: link.sponsor_id,
    tier: link.tier,
    sort_order: link.sort_order,
    published: link.published,
    sponsor: sponsor as DbSponsor,
  };
}

export async function updateEditionSponsor(
  sponsorId: string,
  input: SponsorInput,
  editionId?: string
): Promise<void> {
  const edId = editionId || (await getCurrentEdition()).id;
  const name = input.name.trim();
  if (!name) throw new Error('Sponsor name is required.');

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error: sponsorError } = await supabase
    .from('sponsors')
    .update({
      name,
      website_url: input.website_url?.trim() || null,
      logo_path: input.logo_path || null,
    })
    .eq('id', sponsorId);

  if (sponsorError) throw new Error(sponsorError.message);

  const { error: linkError } = await supabase
    .from('edition_sponsors')
    .update({
      tier: input.tier.trim() || 'Supporter',
      sort_order: input.sort_order,
      published: input.published,
    })
    .eq('edition_id', edId)
    .eq('sponsor_id', sponsorId);

  if (linkError) throw new Error(linkError.message);
}

export async function setEditionSponsorPublished(
  sponsorId: string,
  published: boolean,
  editionId?: string
): Promise<void> {
  const edId = editionId || (await getCurrentEdition()).id;
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('edition_sponsors')
    .update({ published })
    .eq('edition_id', edId)
    .eq('sponsor_id', sponsorId);

  if (error) throw new Error(error.message);
}

export async function deleteEditionSponsor(sponsorId: string, editionId?: string): Promise<void> {
  const edId = editionId || (await getCurrentEdition()).id;
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error: linkError } = await supabase
    .from('edition_sponsors')
    .delete()
    .eq('edition_id', edId)
    .eq('sponsor_id', sponsorId);

  if (linkError) throw new Error(linkError.message);

  // Remove the sponsor record if it is no longer linked to any edition.
  const { count } = await supabase
    .from('edition_sponsors')
    .select('sponsor_id', { count: 'exact', head: true })
    .eq('sponsor_id', sponsorId);

  if ((count ?? 0) === 0) {
    const { error: sponsorError } = await supabase.from('sponsors').delete().eq('id', sponsorId);
    if (sponsorError) throw new Error(sponsorError.message);
  }
}

export async function uploadSponsorLogo(file: File, editionId: string): Promise<string> {
  const result = await uploadPublicImage(file, {
    editionId,
    folder: 'sponsors',
    title: file.name,
    altText: 'Sponsor logo',
  });
  return result.objectPath;
}

/** Group published sponsors by tier for the public page. */
export function groupSponsorsByTier(rows: EditionSponsorRow[]): { tier: string; items: EditionSponsorRow[] }[] {
  const orderHint = new Map(SPONSOR_TIERS.map((t, i) => [t.toLowerCase(), i]));
  const groups = new Map<string, EditionSponsorRow[]>();

  for (const row of rows) {
    const tier = row.tier || 'Supporter';
    const list = groups.get(tier) || [];
    list.push(row);
    groups.set(tier, list);
  }

  return [...groups.entries()]
    .sort((a, b) => {
      const ai = orderHint.get(a[0].toLowerCase()) ?? 100;
      const bi = orderHint.get(b[0].toLowerCase()) ?? 100;
      if (ai !== bi) return ai - bi;
      return a[0].localeCompare(b[0]);
    })
    .map(([tier, items]) => ({
      tier,
      items: items.sort((x, y) => x.sort_order - y.sort_order || x.sponsor.name.localeCompare(y.sponsor.name)),
    }));
}
