import { supabase } from '../../lib/supabase';
import type { DbStaffInvite, DbStaffRequest, Profile, AppRole } from '../../types';

export interface PendingStaffRequest extends DbStaffRequest {
  applicantName: string;
  applicantMobile: string | null;
  applicantLocality: string | null;
  applicantEmail?: string | null;
}

export interface StaffInviteClaimant {
  requestId: string;
  userId: string;
  name: string;
  email: string | null;
  mobile: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  assignedRoles: AppRole[];
}

export interface TrackedStaffInvite extends DbStaffInvite {
  remainingUses: number | 'unlimited';
  claimants: StaffInviteClaimant[];
}

/**
 * Super Admin: Generate a new committee staff invite code
 */
export async function generateStaffInviteCode(params: {
  note?: string;
  maxUses?: number;
  expiresInDays?: number;
  customCode?: string;
}): Promise<DbStaffInvite> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.rpc('generate_staff_invite', {
    p_note: params.note?.trim() || null,
    p_max_uses: params.maxUses ?? 1,
    p_expires_in_days: params.expiresInDays ?? 30,
    p_custom_code: params.customCode?.trim() || null,
  });

  if (error) throw new Error(error.message);
  return data as unknown as DbStaffInvite;
}

/**
 * Super Admin: Deactivate / revoke an invite code
 */
export async function revokeStaffInviteCode(inviteId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.rpc('revoke_staff_invite', {
    p_invite_id: inviteId,
  });

  if (error) throw new Error(error.message);
}

/**
 * Super Admin: Permanently delete an invite code so it is no longer shown on the page.
 * All staff members who previously signed up using this code will NOT be affected
 * (their accounts, granted roles, and registration passes remain completely intact).
 */
export async function deleteStaffInviteCode(inviteId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.rpc('delete_staff_invite', {
    p_invite_id: inviteId,
  });

  if (error) {
    // Fallback to direct PostgREST delete under staff_invites_delete policy
    const { error: directErr } = await supabase
      .from('staff_invites')
      .delete()
      .eq('id', inviteId);
    if (directErr) throw new Error(directErr.message);
  }
}

/**
 * Admins & Super Admins: List all generated staff invite codes with real-time usage tracking & claimant emails
 * Implements Golden Rule 3 (parallel queries joined in memory)
 */
export async function listTrackedStaffInvites(): Promise<TrackedStaffInvite[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const [invitesRes, requestsRes, profilesRes] = await Promise.all([
    supabase.from('staff_invites').select('*').order('created_at', { ascending: false }),
    supabase.from('staff_requests').select('*').order('requested_at', { ascending: false }),
    supabase.from('profiles').select('*'),
  ]);

  if (invitesRes.error) throw new Error(invitesRes.error.message);
  if (requestsRes.error) throw new Error(requestsRes.error.message);
  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const profilesMap = new Map<string, Profile>(
    ((profilesRes.data ?? []) as Profile[]).map((p) => [p.id, p])
  );

  // Group requests by invite_id and normalized invite_code
  const requestsByInviteId = new Map<string, DbStaffRequest[]>();
  const requestsByCode = new Map<string, DbStaffRequest[]>();

  for (const req of (requestsRes.data ?? []) as DbStaffRequest[]) {
    if (req.invite_id) {
      const list = requestsByInviteId.get(req.invite_id) ?? [];
      list.push(req);
      requestsByInviteId.set(req.invite_id, list);
    }
    if (req.invite_code) {
      const normalized = req.invite_code.trim().toUpperCase();
      const list = requestsByCode.get(normalized) ?? [];
      list.push(req);
      requestsByCode.set(normalized, list);
    }
  }

  return ((invitesRes.data ?? []) as DbStaffInvite[]).map((inv) => {
    const matchingReqs =
      requestsByInviteId.get(inv.id) ??
      requestsByCode.get(inv.code.trim().toUpperCase()) ??
      [];

    const claimants: StaffInviteClaimant[] = matchingReqs.map((req) => {
      const prof = profilesMap.get(req.user_id);
      return {
        requestId: req.id,
        userId: req.user_id,
        name: req.applicant_name || prof?.full_name || 'Unnamed Applicant',
        email: req.applicant_email || prof?.email || null,
        mobile: prof?.mobile || null,
        status: req.status,
        requestedAt: req.requested_at,
        assignedRoles: (req.assigned_roles as AppRole[]) || [],
      };
    });

    const remainingUses: number | 'unlimited' =
      inv.max_uses === 0 ? 'unlimited' : Math.max(0, inv.max_uses - inv.uses_count);

    return {
      ...inv,
      remainingUses,
      claimants,
    };
  });
}

/**
 * Admins & Super Admins: List all generated staff invite codes (simple)
 */
export async function listStaffInviteCodes(): Promise<DbStaffInvite[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('staff_invites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DbStaffInvite[];
}

/**
 * Invitee: Claim an invite code after signing in with Google
 */
export async function claimStaffInviteCode(code: string): Promise<{
  status: string;
  message: string;
}> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.rpc('claim_staff_invite', {
    p_code: code.trim(),
  });

  if (error) throw new Error(error.message);
  return data as unknown as { status: string; message: string };
}

/**
 * Invitee: Check the current user's staff approval request status
 */
export async function getMyStaffRequest(userId: string): Promise<DbStaffRequest | null> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('staff_requests')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as DbStaffRequest | null;
}

/**
 * Admins & Super Admins: List all staff onboarding requests
 * Implements Golden Rule 3 (no PostgREST embedding on profiles)
 */
export async function listStaffRequests(): Promise<PendingStaffRequest[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const [requestsRes, profilesRes] = await Promise.all([
    supabase.from('staff_requests').select('*').order('requested_at', { ascending: false }),
    supabase.from('profiles').select('*'),
  ]);

  if (requestsRes.error) throw new Error(requestsRes.error.message);
  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const profilesMap = new Map<string, Profile>(
    ((profilesRes.data ?? []) as Profile[]).map((p) => [p.id, p])
  );

  return ((requestsRes.data ?? []) as DbStaffRequest[]).map((req) => {
    const prof = profilesMap.get(req.user_id);
    return {
      ...req,
      applicantName: req.applicant_name || prof?.full_name || 'Unnamed Applicant',
      applicantMobile: prof?.mobile || null,
      applicantLocality: prof?.locality || null,
      applicantEmail: req.applicant_email || prof?.email || null,
    };
  });
}

/**
 * Admins & Super Admins: Approve a staff request and assign roles
 */
export async function approveStaffRequest(
  requestId: string,
  roles: AppRole[]
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.rpc('approve_staff_request', {
    p_request_id: requestId,
    p_roles: roles,
  });

  if (error) throw new Error(error.message);
}

/**
 * Admins & Super Admins: Reject a staff onboarding request
 */
export async function rejectStaffRequest(
  requestId: string,
  reason?: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.rpc('reject_staff_request', {
    p_request_id: requestId,
    p_reason: reason?.trim() || null,
  });

  if (error) throw new Error(error.message);
}
