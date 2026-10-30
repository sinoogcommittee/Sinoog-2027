import { supabase } from '../../lib/supabase';
import type { DbAuditLog } from '../../types';

export interface AuditLogItem {
  id: number;
  actorId: string | null;
  actorName: string;
  action: string;
  entityTable: string;
  entityId: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface AuditSummaryStats {
  total: number;
  securityCount: number;
  registrationCount: number;
  financeCount: number;
}

/**
 * List audit logs with in-memory profile resolution and optional filters.
 */
export async function listAuditLogs(options?: {
  limit?: number;
  action?: string;
  entityTable?: string;
}): Promise<AuditLogItem[]> {
  if (!supabase) return [];

  const limit = options?.limit ?? 150;
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options?.action && options.action !== 'all') {
    query = query.eq('action', options.action);
  }
  if (options?.entityTable && options.entityTable !== 'all') {
    query = query.eq('entity_table', options.entityTable);
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  // Collect unique actor IDs to fetch profile full names
  const actorIds = Array.from(
    new Set(
      rows
        .map((r: DbAuditLog) => r.actor_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const profilesMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', actorIds);

    (profiles || []).forEach((p: { id: string; full_name: string | null }) => {
      profilesMap[p.id] = p.full_name || 'Staff User';
    });
  }

  return rows.map((r: DbAuditLog) => ({
    id: r.id,
    actorId: r.actor_id,
    actorName: r.actor_id ? (profilesMap[r.actor_id] || 'Staff User') : 'System / Automated',
    action: r.action,
    entityTable: r.entity_table,
    entityId: r.entity_id,
    detail: (typeof r.detail === 'object' && r.detail !== null ? r.detail : {}) as Record<string, unknown>,
    createdAt: r.created_at,
  }));
}

/**
 * Compute key summary statistics for high-level committee monitoring.
 */
export function computeAuditSummaryStats(logs: AuditLogItem[]): AuditSummaryStats {
  let securityCount = 0;
  let registrationCount = 0;
  let financeCount = 0;

  for (const log of logs) {
    const act = log.action.toLowerCase();
    const table = log.entityTable.toLowerCase();

    if (
      act.includes('role') ||
      act.includes('suspend') ||
      act.includes('reactivate') ||
      act.includes('delete') ||
      table === 'user_roles' ||
      table === 'profiles'
    ) {
      securityCount++;
    } else if (
      act.includes('registration') ||
      act.includes('bib') ||
      act.includes('claim') ||
      table === 'run_registrations' ||
      table === 'kit_claims' ||
      table === 'run_finish_records'
    ) {
      registrationCount++;
    } else if (
      act.includes('finance') ||
      act.includes('payment') ||
      act.includes('void') ||
      table === 'finance_records' ||
      table === 'payments'
    ) {
      financeCount++;
    }
  }

  return {
    total: logs.length,
    securityCount,
    registrationCount,
    financeCount,
  };
}

/**
 * Convert snake_case action names into clean human-friendly titles.
 */
export function formatActionLabel(action: string): string {
  const map: Record<string, string> = {
    registration_approved: 'Registration Approved',
    registration_changes_requested: 'Changes Requested',
    registration_rejected: 'Registration Rejected',
    registration_created: 'Registration Created',
    registration_reviewed: 'Registration Reviewed',
    admin_register_cash_runner: 'Admin Cash Registration',
    admin_bib_reassigned: 'Bib Reassigned',
    kit_claimed: 'Kit Handed Over',
    run_event_started: 'Race Gun Started',
    race_finished: 'Runner Finished',
    user_suspended: 'Account Suspended',
    user_reactivated: 'Account Reactivated',
    role_granted: 'Staff Role Granted',
    role_revoked: 'Staff Role Revoked',
    user_deleted: 'Account Deleted',
    activities_reordered: 'Activities Reordered',
    finance_record_voided: 'Finance Record Voided',
    payment_verified: 'Payment Verified',
    cash_registration_created: 'Cash Payment Recorded',
  };

  if (map[action]) return map[action];
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Badge styling according to action criticality.
 */
export function getActionBadgeStyle(action: string): { bg: string; color: string; border: string } {
  const act = action.toLowerCase();
  if (act.includes('approved') || act.includes('verified') || act.includes('reactivate')) {
    return { bg: 'rgba(32, 201, 151, 0.12)', color: '#099268', border: 'rgba(32, 201, 151, 0.35)' };
  }
  if (act.includes('suspend') || act.includes('reject') || act.includes('void') || act.includes('delete') || act.includes('revoked')) {
    return { bg: 'rgba(255, 107, 107, 0.12)', color: '#c92a2a', border: 'rgba(255, 107, 107, 0.35)' };
  }
  if (act.includes('role') || act.includes('change') || act.includes('reassign')) {
    return { bg: 'rgba(255, 212, 59, 0.25)', color: '#b25e00', border: 'rgba(245, 159, 0, 0.4)' };
  }
  return { bg: 'rgba(24, 100, 171, 0.1)', color: '#1864ab', border: 'rgba(24, 100, 171, 0.3)' };
}

/**
 * Format audit logs as CSV for audit compliance and committee filing.
 */
export function exportAuditLogsToCsv(logs: AuditLogItem[]): string {
  const headers = ['ID', 'Timestamp (Asia/Manila)', 'Action', 'Actor Name', 'Entity Table', 'Entity ID', 'Detail Summary', 'Detail JSON'];
  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const rows = logs.map((log) => {
    const dateFormatted = new Date(log.createdAt).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    const summary = Object.entries(log.detail)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join('; ');

    return [
      log.id.toString(),
      escapeCell(dateFormatted),
      escapeCell(formatActionLabel(log.action)),
      escapeCell(log.actorName),
      escapeCell(log.entityTable),
      escapeCell(log.entityId || 'N/A'),
      escapeCell(summary),
      escapeCell(JSON.stringify(log.detail)),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}
