import { supabase } from '../../lib/supabase';
import type { AppRole, Profile } from '../../types';

export type StaffRole = 'admin' | 'news_in_charge' | 'delegation_head';

export interface ManagedUser {
  id: string;
  email?: string | null;
  full_name: string | null;
  mobile: string | null;
  locality: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
  roles: AppRole[];
}

export interface ManagedUserUpdate {
  user_id: string;
  email: string;
  full_name: string;
  mobile: string;
  locality: string;
  roles: StaffRole[];
  suspended: boolean;
  new_password?: string;
}

export interface ManagedStaffCreate {
  email: string;
  password: string;
  full_name: string;
  mobile: string;
  locality: string;
  roles: StaffRole[];
}

export interface ManagedUserDeletionPreview {
  eligible: boolean;
  eligibility: 'suspended' | 'rejected_or_cancelled' | 'no_registration' | 'active_registration';
  registration_count: number;
  payment_evidence_count: number;
  preserved_content_count: number;
}

const STAFF_ROLES: StaffRole[] = ['admin', 'news_in_charge', 'delegation_head'];

function isStaffRole(role: AppRole): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export async function listUsersForAdmin(): Promise<ManagedUser[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id, role'),
  ]);

  if (pErr) throw new Error(pErr.message);
  if (rErr) throw new Error(rErr.message);

  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) {
    const list = rolesByUser.get(row.user_id) ?? [];
    list.push(row.role as AppRole);
    rolesByUser.set(row.user_id, list);
  }

  return (profiles as Profile[]).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    mobile: p.mobile,
    locality: p.locality,
    suspended_at: p.suspended_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
    roles: rolesByUser.get(p.id) ?? [],
  }));
}

export async function updateUserProfileAsAdmin(
  userId: string,
  updates: { full_name?: string | null; mobile?: string | null; locality?: string | null }
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('profiles')
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

/**
 * Replace staff roles for a user. Always keeps public_user.
 * Only admins should call this (enforced by RLS).
 */
export async function setUserStaffRoles(
  userId: string,
  nextStaffRoles: StaffRole[],
  actorId: string | null
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const unique = Array.from(new Set(nextStaffRoles.filter(isStaffRole)));

  // Load current roles
  const { data: current, error: readErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (readErr) throw new Error(readErr.message);

  const currentRoles = (current ?? []).map((r) => r.role as AppRole);
  const currentStaff = currentRoles.filter(isStaffRole);

  const toAdd = unique.filter((r) => !currentStaff.includes(r));
  const toRemove = currentStaff.filter((r) => !unique.includes(r));

  // Never remove the last admin in the system
  if (toRemove.includes('admin')) {
    const { data: admins, error: adminErr } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminErr) throw new Error(adminErr.message);
    const otherAdmins = (admins ?? []).filter((a) => a.user_id !== userId);
    if (otherAdmins.length === 0) {
      throw new Error('Cannot remove the last administrator role.');
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .in('role', toRemove);
    if (error) throw new Error(error.message);
  }

  if (toAdd.length > 0) {
    const rows = toAdd.map((role) => ({
      user_id: userId,
      role,
      assigned_by: actorId,
    }));
    const { error } = await supabase.from('user_roles').insert(rows);
    if (error) throw new Error(error.message);
  }

  // Ensure public_user always present
  if (!currentRoles.includes('public_user')) {
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'public_user',
      assigned_by: actorId,
    });
    if (error && !error.message.toLowerCase().includes('duplicate')) {
      throw new Error(error.message);
    }
  }
}

async function invokeAdminUser<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('admin-manage-user', { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export async function getManagedUserDetails(userId: string): Promise<ManagedUser> {
  const data = await invokeAdminUser<{ user: ManagedUser }>({ action: 'get', user_id: userId });
  return data.user;
}

export async function createManagedStaffAccount(input: ManagedStaffCreate): Promise<ManagedUser> {
  const data = await invokeAdminUser<{ user: ManagedUser }>({ action: 'create', ...input });
  return data.user;
}

export async function updateManagedUserAsAdmin(update: ManagedUserUpdate): Promise<ManagedUser> {
  const data = await invokeAdminUser<{ user: ManagedUser }>({ action: 'update', ...update });
  return data.user;
}

export async function deleteManagedUserAsAdmin(userId: string): Promise<void> {
  await invokeAdminUser<{ deleted: true }>({ action: 'delete', user_id: userId });
}

export async function getManagedUserDeletionPreview(userId: string): Promise<ManagedUserDeletionPreview> {
  const data = await invokeAdminUser<{ preview: ManagedUserDeletionPreview }>({
    action: 'delete-preview',
    user_id: userId,
  });
  return data.preview;
}
