import { describe, expect, it } from 'vitest';
import {
  computeAuditSummaryStats,
  exportAuditLogsToCsv,
  formatActionLabel,
  getActionBadgeStyle,
  type AuditLogItem,
} from './auditQueries';

describe('auditQueries', () => {
  const sampleLogs: AuditLogItem[] = [
    {
      id: 1,
      actorId: 'usr-admin-1',
      actorName: 'Admin Anthony',
      action: 'registration_approved',
      entityTable: 'run_registrations',
      entityId: 'reg-101',
      detail: { bib_number: '1001', category: '5K' },
      createdAt: '2026-10-30T08:00:00Z',
    },
    {
      id: 2,
      actorId: 'usr-admin-1',
      actorName: 'Admin Anthony',
      action: 'role_granted',
      entityTable: 'user_roles',
      entityId: 'usr-staff-2',
      detail: { role: 'delegation_head' },
      createdAt: '2026-10-30T08:15:00Z',
    },
    {
      id: 3,
      actorId: 'usr-admin-1',
      actorName: 'Admin Anthony',
      action: 'finance_record_voided',
      entityTable: 'finance_records',
      entityId: 'fin-301',
      detail: { amount_centavos: 50000, reason: 'Duplicate entry' },
      createdAt: '2026-10-30T08:30:00Z',
    },
    {
      id: 4,
      actorId: null,
      actorName: 'System / Automated',
      action: 'user_suspended',
      entityTable: 'profiles',
      entityId: 'usr-bad-4',
      detail: { reason: 'Policy violation' },
      createdAt: '2026-10-30T08:45:00Z',
    },
  ];

  it('computes audit summary statistics correctly', () => {
    const stats = computeAuditSummaryStats(sampleLogs);
    expect(stats.total).toBe(4);
    expect(stats.registrationCount).toBe(1); // registration_approved
    expect(stats.securityCount).toBe(2); // role_granted, user_suspended
    expect(stats.financeCount).toBe(1); // finance_record_voided
  });

  it('formats action labels cleanly into human-readable titles', () => {
    expect(formatActionLabel('registration_approved')).toBe('Registration Approved');
    expect(formatActionLabel('admin_register_cash_runner')).toBe('Admin Cash Registration');
    expect(formatActionLabel('finance_record_voided')).toBe('Finance Record Voided');
    expect(formatActionLabel('custom_unmapped_event')).toBe('Custom Unmapped Event');
  });

  it('returns appropriate badge styles for different action criticality', () => {
    const approvedBadge = getActionBadgeStyle('registration_approved');
    expect(approvedBadge.color).toBe('#099268');

    const suspendedBadge = getActionBadgeStyle('user_suspended');
    expect(suspendedBadge.color).toBe('#c92a2a');

    const roleBadge = getActionBadgeStyle('role_granted');
    expect(roleBadge.color).toBe('#b25e00');

    const defaultBadge = getActionBadgeStyle('unknown_notice');
    expect(defaultBadge.color).toBe('#1864ab');
  });

  it('exports audit records to RFC-4180 CSV format', () => {
    const csv = exportAuditLogsToCsv(sampleLogs);
    expect(csv).toContain('ID,Timestamp (Asia/Manila),Action,Actor Name,Entity Table,Entity ID,Detail Summary,Detail JSON');
    expect(csv).toContain('"Registration Approved"');
    expect(csv).toContain('"Admin Anthony"');
    expect(csv).toContain('"run_registrations"');
    expect(csv).toContain('"reg-101"');
    expect(csv).toContain('"finance_records"');
  });
});
