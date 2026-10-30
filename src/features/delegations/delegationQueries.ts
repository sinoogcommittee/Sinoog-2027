import { supabase } from '../../lib/supabase';
import type { DbDelegation, DbDelegationEntry, DbDelegationFile, DbDelegationParticipant } from '../../types';

export interface DelegationHeadInfo {
  userId: string;
  fullName: string;
  email: string | null;
}

export interface DelegationFileRecord {
  id: string;
  entryId: string;
  kind: 'music' | 'roster' | 'photo' | 'document';
  objectPath: string;
  originalName: string;
  mimeType: string | null;
  bytes: number | null;
  version: number;
  uploadedBy: string | null;
  createdAt: string;
  signedUrl?: string;
}

export interface DelegationParticipantRecord {
  id: string;
  entryId: string;
  fullName: string;
  roleOrPosition: string | null;
  birthDate: string | null;
  version: number;
  createdAt: string;
}

export interface DelegationWithDetails {
  id: string;
  name: string;
  locality: string | null;
  createdAt: string;
  head: DelegationHeadInfo | null;
  entry: DbDelegationEntry | null;
  participantCount: number;
  participants?: DelegationParticipantRecord[];
  files: DelegationFileRecord[];
  primaryMusic: DelegationFileRecord | null;
}

export interface PublicApprovedDelegation {
  id: string;
  name: string;
  locality: string | null;
  theme: string | null;
  description: string | null;
  participantCount: number;
  hasMusic: boolean;
}

export interface PotentialHeadUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isDelegationHead: boolean;
  assignedContingentName: string | null;
}

/**
 * List all delegations with their entries, assigned heads, participant counts, and files for an edition.
 */
export async function listDelegationsWithDetails(editionId: string): Promise<DelegationWithDetails[]> {
  if (!supabase) return [];

  // 1. Fetch all delegations
  const { data: delegations, error: delError } = await supabase
    .from('delegations')
    .select('*')
    .order('name', { ascending: true });

  if (delError) throw new Error(delError.message);
  if (!delegations || delegations.length === 0) return [];

  const delegationIds = delegations.map((d: DbDelegation) => d.id);

  // 2. Fetch memberships for these delegations
  const { data: memberships, error: memError } = await supabase
    .from('delegation_memberships')
    .select('delegation_id, user_id, is_head')
    .in('delegation_id', delegationIds)
    .eq('is_head', true);

  if (memError) throw new Error(memError.message);

  const headUserIds = (memberships || []).map((m: { user_id: string }) => m.user_id);
  const profilesMap: Record<string, string> = {};
  if (headUserIds.length > 0) {
    const { data: profs, error: profError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', headUserIds);
    if (!profError && profs) {
      profs.forEach((p: { id: string; full_name: string | null }) => {
        profilesMap[p.id] = p.full_name || 'Assigned Head';
      });
    }
  }

  // 3. Fetch entries for these delegations in this edition
  const { data: entries, error: entryError } = await supabase
    .from('delegation_entries')
    .select('*')
    .eq('edition_id', editionId)
    .in('delegation_id', delegationIds);

  if (entryError) throw new Error(entryError.message);

  const entryIds = (entries || []).map((e: DbDelegationEntry) => e.id);

  // 4. Fetch participant counts for these entries
  const participantCountMap: Record<string, number> = {};
  if (entryIds.length > 0) {
    const { data: participants, error: partError } = await supabase
      .from('delegation_participants')
      .select('entry_id')
      .in('entry_id', entryIds);

    if (partError) throw new Error(partError.message);
    (participants || []).forEach((p: { entry_id: string }) => {
      participantCountMap[p.entry_id] = (participantCountMap[p.entry_id] || 0) + 1;
    });
  }

  // 5. Fetch files for these entries
  const filesByEntry: Record<string, DelegationFileRecord[]> = {};
  if (entryIds.length > 0) {
    const { data: fileRows, error: fileError } = await supabase
      .from('delegation_files')
      .select('*')
      .in('entry_id', entryIds)
      .order('created_at', { ascending: false });

    if (fileError) throw new Error(fileError.message);
    (fileRows || []).forEach((f: DbDelegationFile) => {
      if (!filesByEntry[f.entry_id]) {
        filesByEntry[f.entry_id] = [];
      }
      filesByEntry[f.entry_id].push({
        id: f.id,
        entryId: f.entry_id,
        kind: f.kind,
        objectPath: f.object_path,
        originalName: f.original_name,
        mimeType: f.mime_type,
        bytes: f.bytes,
        version: f.version,
        uploadedBy: f.uploaded_by,
        createdAt: f.created_at,
      });
    });
  }

  // Build composite result
  return delegations.map((d: DbDelegation) => {
    // Find head
    const mem = (memberships || []).find((m: { delegation_id: string }) => m.delegation_id === d.id);
    let head: DelegationHeadInfo | null = null;
    if (mem) {
      head = {
        userId: mem.user_id,
        fullName: profilesMap[mem.user_id] || 'Assigned Head',
        email: null,
      };
    }

    // Find entry
    const entry = (entries || []).find((e: DbDelegationEntry) => e.delegation_id === d.id) || null;
    const participantCount = entry ? (participantCountMap[entry.id] || 0) : 0;
    const files = entry ? (filesByEntry[entry.id] || []) : [];
    const primaryMusic = files.find((f) => f.kind === 'music') || null;

    return {
      id: d.id,
      name: d.name,
      locality: d.locality,
      createdAt: d.created_at,
      head,
      entry,
      participantCount,
      files,
      primaryMusic,
    };
  });
}

/**
 * Fetch a single delegation with its participants and files for editing.
 */
export async function getDelegationDetails(delegationId: string, editionId: string): Promise<DelegationWithDetails> {
  if (!supabase) throw new Error('Supabase is not configured.');

  // 1. Fetch delegation
  const { data: delegation, error: delError } = await supabase
    .from('delegations')
    .select('*')
    .eq('id', delegationId)
    .single();

  if (delError) throw new Error(delError.message);

  // 2. Fetch membership
  const { data: membership } = await supabase
    .from('delegation_memberships')
    .select('delegation_id, user_id, is_head')
    .eq('delegation_id', delegationId)
    .eq('is_head', true)
    .maybeSingle();

  let head: DelegationHeadInfo | null = null;
  if (membership) {
    const { data: p } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', membership.user_id)
      .maybeSingle();

    head = {
      userId: membership.user_id,
      fullName: p?.full_name || 'Assigned Head',
      email: null,
    };
  }

  // 3. Ensure delegation_entries row exists for this edition
  let { data: entry, error: entryError } = await supabase
    .from('delegation_entries')
    .select('*')
    .eq('delegation_id', delegationId)
    .eq('edition_id', editionId)
    .maybeSingle();

  if (entryError) throw new Error(entryError.message);

  if (!entry) {
    const { data: newEntry, error: createEntryError } = await supabase
      .from('delegation_entries')
      .insert({
        delegation_id: delegationId,
        edition_id: editionId,
        status: 'draft',
        current_version: 1,
      })
      .select('*')
      .single();

    if (createEntryError) throw new Error(createEntryError.message);
    entry = newEntry;
  }

  // 4. Fetch participants
  const { data: participants, error: partError } = await supabase
    .from('delegation_participants')
    .select('*')
    .eq('entry_id', entry.id)
    .order('created_at', { ascending: true });

  if (partError) throw new Error(partError.message);

  const participantRecords: DelegationParticipantRecord[] = (participants || []).map((p: DbDelegationParticipant) => ({
    id: p.id,
    entryId: p.entry_id,
    fullName: p.full_name,
    roleOrPosition: p.role_or_position,
    birthDate: p.birth_date,
    version: p.version,
    createdAt: p.created_at,
  }));

  // 5. Fetch files
  const { data: fileRows, error: fileError } = await supabase
    .from('delegation_files')
    .select('*')
    .eq('entry_id', entry.id)
    .order('created_at', { ascending: false });

  if (fileError) throw new Error(fileError.message);

  const files: DelegationFileRecord[] = await Promise.all(
    (fileRows || []).map(async (f: DbDelegationFile) => {
      let signedUrl: string | undefined;
      try {
        const { data: urlData } = await supabase!.storage
          .from('delegation-files')
          .createSignedUrl(f.object_path, 3600);
        signedUrl = urlData?.signedUrl;
      } catch {
        // Fallback gracefully if sign fails
      }

      return {
        id: f.id,
        entryId: f.entry_id,
        kind: f.kind,
        objectPath: f.object_path,
        originalName: f.original_name,
        mimeType: f.mime_type,
        bytes: f.bytes,
        version: f.version,
        uploadedBy: f.uploaded_by,
        createdAt: f.created_at,
        signedUrl,
      };
    })
  );

  const primaryMusic = files.find((f) => f.kind === 'music') || null;

  return {
    id: delegation.id,
    name: delegation.name,
    locality: delegation.locality,
    createdAt: delegation.created_at,
    head,
    entry,
    participantCount: participantRecords.length,
    participants: participantRecords,
    files,
    primaryMusic,
  };
}

/**
 * Fetch the delegation assigned to the current user (if they are a delegation head).
 */
export async function getDelegationForUser(userId: string, editionId: string): Promise<DelegationWithDetails | null> {
  if (!supabase) return null;

  const { data: membership, error: memError } = await supabase
    .from('delegation_memberships')
    .select('delegation_id')
    .eq('user_id', userId)
    .eq('is_head', true)
    .maybeSingle();

  if (memError) throw new Error(memError.message);
  if (!membership) return null;

  return getDelegationDetails(membership.delegation_id, editionId);
}

/**
 * List registered users who can be selected as a delegation head.
 */
export async function listPotentialHeads(): Promise<PotentialHeadUser[]> {
  if (!supabase) return [];

  const [
    { data: profiles, error: pErr },
    { data: roleRows, error: rErr },
    { data: memberships, error: mErr },
    { data: delegations, error: dErr },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name').order('full_name', { ascending: true }),
    supabase.from('user_roles').select('user_id, role'),
    supabase.from('delegation_memberships').select('user_id, delegation_id').eq('is_head', true),
    supabase.from('delegations').select('id, name'),
  ]);

  if (pErr) throw new Error(pErr.message);
  if (rErr) throw new Error(rErr.message);
  if (mErr) throw new Error(mErr.message);
  if (dErr) throw new Error(dErr.message);

  const rolesByUser: Record<string, string[]> = {};
  (roleRows || []).forEach((r: { user_id: string; role: string }) => {
    if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
    rolesByUser[r.user_id].push(r.role);
  });

  const delNameById: Record<string, string> = {};
  (delegations || []).forEach((d: { id: string; name: string }) => {
    delNameById[d.id] = d.name;
  });

  const assignedContingentByUser: Record<string, string> = {};
  (memberships || []).forEach((m: { user_id: string; delegation_id: string }) => {
    assignedContingentByUser[m.user_id] = delNameById[m.delegation_id] || 'Assigned Contingent';
  });

  return (profiles || []).map((p: { id: string; full_name: string | null }) => {
    const roles = rolesByUser[p.id] || [];
    const isDelegationHead = roles.includes('delegation_head');
    const assignedContingentName = assignedContingentByUser[p.id] || null;

    return {
      id: p.id,
      fullName: p.full_name || 'Unnamed Account',
      email: '',
      roles,
      isDelegationHead,
      assignedContingentName,
    };
  });
}

/**
 * Create a new contingent (delegation) and optionally assign its head and initial entry.
 */
export async function createDelegation(params: {
  name: string;
  locality?: string;
  headUserId?: string;
  editionId: string;
}): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');

  // 1. Insert delegation
  const { data: delegation, error: delError } = await supabase
    .from('delegations')
    .insert({
      name: params.name.trim(),
      locality: params.locality?.trim() || null,
    })
    .select('id')
    .single();

  if (delError) throw new Error(delError.message);

  // 2. Assign head if specified
  if (params.headUserId) {
    const { error: memError } = await supabase
      .from('delegation_memberships')
      .insert({
        delegation_id: delegation.id,
        user_id: params.headUserId,
        is_head: true,
      });

    if (memError) throw new Error(memError.message);

    // Ensure role exists in user_roles
    await supabase
      .from('user_roles')
      .upsert({ user_id: params.headUserId, role: 'delegation_head' }, { onConflict: 'user_id,role' });
  }

  // 3. Create initial draft entry for this edition
  const { error: entryError } = await supabase
    .from('delegation_entries')
    .insert({
      delegation_id: delegation.id,
      edition_id: params.editionId,
      status: 'draft',
      current_version: 1,
    });

  if (entryError) throw new Error(entryError.message);

  return delegation.id;
}

/**
 * Update delegation basic info (name, locality).
 */
export async function updateDelegation(
  delegationId: string,
  params: { name: string; locality?: string }
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('delegations')
    .update({
      name: params.name.trim(),
      locality: params.locality?.trim() || null,
    })
    .eq('id', delegationId);

  if (error) throw new Error(error.message);
}

/**
 * Assign or reassign a delegation head.
 */
export async function assignDelegationHead(delegationId: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  // Remove existing head memberships for this delegation
  await supabase
    .from('delegation_memberships')
    .delete()
    .eq('delegation_id', delegationId);

  // Insert new head membership
  const { error } = await supabase
    .from('delegation_memberships')
    .insert({
      delegation_id: delegationId,
      user_id: userId,
      is_head: true,
    });

  if (error) throw new Error(error.message);

  // Ensure role is granted in user_roles
  await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'delegation_head' }, { onConflict: 'user_id,role' });
}

/**
 * Delete a contingent and all linked entries, participants, and files.
 */
export async function deleteDelegation(delegationId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  // Delete all storage objects under this delegation's folder
  try {
    const { data: files } = await supabase.storage
      .from('delegation-files')
      .list(delegationId);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${delegationId}/${f.name}`);
      await supabase.storage.from('delegation-files').remove(paths);
    }
  } catch {
    // Continue if storage folder cleanup fails
  }

  const { error } = await supabase.from('delegations').delete().eq('id', delegationId);
  if (error) throw new Error(error.message);
}

/**
 * Update choreography theme and narrative synopsis on an entry.
 */
export async function updateEntryThemeAndDescription(
  entryId: string,
  params: { theme?: string; description?: string }
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('delegation_entries')
    .update({
      theme: params.theme !== undefined ? params.theme.trim() || null : undefined,
      description: params.description !== undefined ? params.description.trim() || null : undefined,
    })
    .eq('id', entryId);

  if (error) throw new Error(error.message);
}

/**
 * Submit delegation entry for committee review.
 */
export async function submitEntryForReview(entryId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('delegation_entries')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', entryId);

  if (error) throw new Error(error.message);
}

/**
 * Admin action to review an entry (approve, request changes, or reject).
 */
export async function reviewDelegationEntry(
  entryId: string,
  params: {
    status: 'approved' | 'needs_changes' | 'rejected' | 'under_review';
    reviewerNotes?: string;
    reviewerUserId?: string;
  }
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('delegation_entries')
    .update({
      status: params.status,
      reviewed_by: params.reviewerUserId || null,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: params.reviewerNotes?.trim() || null,
    })
    .eq('id', entryId);

  if (error) throw new Error(error.message);
}

/**
 * Participant Roster CRUD
 */
export async function addParticipant(
  entryId: string,
  participant: { fullName: string; roleOrPosition?: string; birthDate?: string }
): Promise<DelegationParticipantRecord> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('delegation_participants')
    .insert({
      entry_id: entryId,
      full_name: participant.fullName.trim(),
      role_or_position: participant.roleOrPosition?.trim() || null,
      birth_date: participant.birthDate || null,
      version: 1,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    entryId: data.entry_id,
    fullName: data.full_name,
    roleOrPosition: data.role_or_position,
    birthDate: data.birth_date,
    version: data.version,
    createdAt: data.created_at,
  };
}

export async function bulkAddParticipants(
  entryId: string,
  participants: Array<{ fullName: string; roleOrPosition?: string; birthDate?: string }>
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (participants.length === 0) return;

  const rows = participants.map((p) => ({
    entry_id: entryId,
    full_name: p.fullName.trim(),
    role_or_position: p.roleOrPosition?.trim() || null,
    birth_date: p.birthDate || null,
    version: 1,
  }));

  const { error } = await supabase.from('delegation_participants').insert(rows);
  if (error) throw new Error(error.message);
}

export async function updateParticipant(
  participantId: string,
  participant: { fullName: string; roleOrPosition?: string; birthDate?: string }
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('delegation_participants')
    .update({
      full_name: participant.fullName.trim(),
      role_or_position: participant.roleOrPosition?.trim() || null,
      birth_date: participant.birthDate || null,
    })
    .eq('id', participantId);

  if (error) throw new Error(error.message);
}

export async function deleteParticipant(participantId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('delegation_participants').delete().eq('id', participantId);
  if (error) throw new Error(error.message);
}

/**
 * File Management (Music Audio and Documents)
 */
export async function uploadDelegationFile(
  delegationId: string,
  entryId: string,
  file: File,
  kind: 'music' | 'roster' | 'photo' | 'document'
): Promise<DelegationFileRecord> {
  if (!supabase) throw new Error('Supabase is not configured.');

  // Clean filename: remove spaces and non-alphanumeric except dots/dashes
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `${delegationId}/${kind}/${Date.now()}_${cleanName}`;

  // 1. Upload to Supabase Storage in private delegation-files bucket
  const { error: storageError } = await supabase.storage
    .from('delegation-files')
    .upload(objectPath, file, {
      upsert: true,
      contentType: file.type || undefined,
    });

  if (storageError) throw new Error(storageError.message);

  // 2. Record row in delegation_files
  const { data: fileRow, error: dbError } = await supabase
    .from('delegation_files')
    .insert({
      entry_id: entryId,
      kind,
      object_path: objectPath,
      original_name: file.name,
      mime_type: file.type || null,
      bytes: file.size,
      version: 1,
    })
    .select('*')
    .single();

  if (dbError) throw new Error(dbError.message);

  // Generate signed URL for immediate playback/preview
  let signedUrl: string | undefined;
  try {
    const { data: urlData } = await supabase.storage
      .from('delegation-files')
      .createSignedUrl(objectPath, 3600);
    signedUrl = urlData?.signedUrl;
  } catch {
    // Graceful fallback
  }

  return {
    id: fileRow.id,
    entryId: fileRow.entry_id,
    kind: fileRow.kind,
    objectPath: fileRow.object_path,
    originalName: fileRow.original_name,
    mimeType: fileRow.mime_type,
    bytes: fileRow.bytes,
    version: fileRow.version,
    uploadedBy: fileRow.uploaded_by,
    createdAt: fileRow.created_at,
    signedUrl,
  };
}

export async function deleteDelegationFile(fileId: string, objectPath: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  // Delete storage object
  await supabase.storage.from('delegation-files').remove([objectPath]);

  // Delete DB row
  const { error } = await supabase.from('delegation_files').delete().eq('id', fileId);
  if (error) throw new Error(error.message);
}

/**
 * Public query: Fetch all approved contingents for the public festival showcase on /festival.
 */
export async function getPublicApprovedDelegations(editionId: string): Promise<PublicApprovedDelegation[]> {
  if (!supabase) return [];

  // Query approved delegation entries
  const { data: entries, error } = await supabase
    .from('delegation_entries')
    .select('id, theme, description, delegation:delegations(id, name, locality)')
    .eq('edition_id', editionId)
    .eq('status', 'approved');

  if (error) {
    console.warn('Unable to load public approved delegations:', error.message);
    return [];
  }

  if (!entries || entries.length === 0) return [];

  const entryIds = entries.map((e: any) => e.id);

  // Fetch participant counts
  const countMap: Record<string, number> = {};
  const { data: participants } = await supabase
    .from('delegation_participants')
    .select('entry_id')
    .in('entry_id', entryIds);

  (participants || []).forEach((p: any) => {
    countMap[p.entry_id] = (countMap[p.entry_id] || 0) + 1;
  });

  // Check music
  const { data: musicFiles } = await supabase
    .from('delegation_files')
    .select('entry_id')
    .eq('kind', 'music')
    .in('entry_id', entryIds);

  const musicSet = new Set((musicFiles || []).map((m: any) => m.entry_id));

  return entries.map((e: any) => {
    const del = e.delegation || {};
    return {
      id: del.id || e.id,
      name: del.name || 'Unnamed Contingent',
      locality: del.locality || null,
      theme: e.theme || null,
      description: e.description || null,
      participantCount: countMap[e.id] || 0,
      hasMusic: musicSet.has(e.id),
    };
  });
}
