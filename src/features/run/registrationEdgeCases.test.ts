import { describe, expect, it } from 'vitest';
import type { DbRunRegistration } from '../../types';

// Mock race kit claim registry to simulate database unique constraint
class MockKitClaimStore {
  private claimedRegistrationIds = new Set<string>();

  public claimKit(registrationId: string, _bibNumber?: string | null): { success: boolean; error?: string } {
    if (this.claimedRegistrationIds.has(registrationId)) {
      return { success: false, error: 'This race kit has already been claimed.' };
    }
    this.claimedRegistrationIds.add(registrationId);
    return { success: true };
  }

  public cancelClaim(registrationId: string): boolean {
    return this.claimedRegistrationIds.delete(registrationId);
  }

  public isClaimed(registrationId: string): boolean {
    return this.claimedRegistrationIds.has(registrationId);
  }
}

// Mock category capacity tracker
class MockCapacityTracker {
  private counts: Map<string, number> = new Map();
  private limits: Map<string, number> = new Map();

  constructor(limits: Record<string, number>) {
    for (const [catId, cap] of Object.entries(limits)) {
      this.limits.set(catId, cap);
      this.counts.set(catId, 0);
    }
  }

  public tryReserveSlot(categoryId: string): { reserved: boolean; remaining: number } {
    const current = this.counts.get(categoryId) ?? 0;
    const limit = this.limits.get(categoryId) ?? Infinity;

    if (current >= limit) {
      return { reserved: false, remaining: 0 };
    }

    const next = current + 1;
    this.counts.set(categoryId, next);
    return { reserved: true, remaining: limit - next };
  }
}

// Payment file validator
export function validatePaymentSlipFile(file: { size: number; type: string }): { valid: boolean; error?: string } {
  const MAX_BYTES = 8 * 1024 * 1024; // 8MB private bucket limit
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, or WebP payment receipts are supported.' };
  }

  if (file.size > MAX_BYTES) {
    return { valid: false, error: 'Payment evidence file size exceeds the 8MB limit.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Uploaded file is empty.' };
  }

  return { valid: true };
}

describe('registrationEdgeCases — Kit Claims, Concurrency & Payment Guards', () => {
  it('prevents double-claiming of race kits when QR is scanned twice', () => {
    const store = new MockKitClaimStore();
    const runnerRegId = 'reg-runner-001';

    // First scan: successful check-in
    const firstClaim = store.claimKit(runnerRegId, '1001');
    expect(firstClaim.success).toBe(true);
    expect(store.isClaimed(runnerRegId)).toBe(true);

    // Second scan (duplicate): blocked with exact duplicate error
    const secondClaim = store.claimKit(runnerRegId, '1001');
    expect(secondClaim.success).toBe(false);
    expect(secondClaim.error).toBe('This race kit has already been claimed.');
  });

  it('allows kit claim cancellation and re-claiming by authorized staff', () => {
    const store = new MockKitClaimStore();
    const runnerRegId = 'reg-runner-002';

    store.claimKit(runnerRegId, '1002');
    expect(store.isClaimed(runnerRegId)).toBe(true);

    // Staff cancels / voids the mistaken claim
    const cancelled = store.cancelClaim(runnerRegId);
    expect(cancelled).toBe(true);
    expect(store.isClaimed(runnerRegId)).toBe(false);

    // Can now be claimed cleanly again
    const retryClaim = store.claimKit(runnerRegId, '1002');
    expect(retryClaim.success).toBe(true);
  });

  it('handles last slot concurrency and rejects overflow registrations', () => {
    const tracker = new MockCapacityTracker({ 'cat-10k': 2 });

    // User 1 gets slot 1
    const res1 = tracker.tryReserveSlot('cat-10k');
    expect(res1.reserved).toBe(true);
    expect(res1.remaining).toBe(1);

    // User 2 gets the last slot (slot 2)
    const res2 = tracker.tryReserveSlot('cat-10k');
    expect(res2.reserved).toBe(true);
    expect(res2.remaining).toBe(0);

    // User 3 attempts to register for 10K when full
    const res3 = tracker.tryReserveSlot('cat-10k');
    expect(res3.reserved).toBe(false);
    expect(res3.remaining).toBe(0);
  });

  it('validates payment slip file type and size constraints', () => {
    // Valid 2MB JPEG
    expect(validatePaymentSlipFile({ size: 2 * 1024 * 1024, type: 'image/jpeg' }).valid).toBe(true);

    // Valid 500KB WebP
    expect(validatePaymentSlipFile({ size: 500 * 1024, type: 'image/webp' }).valid).toBe(true);

    // Invalid file type (PDF receipt)
    const pdfRes = validatePaymentSlipFile({ size: 1024 * 1024, type: 'application/pdf' });
    expect(pdfRes.valid).toBe(false);
    expect(pdfRes.error).toContain('Only JPG, PNG, or WebP');

    // Invalid file size (>8MB)
    const hugeRes = validatePaymentSlipFile({ size: 9 * 1024 * 1024, type: 'image/png' });
    expect(hugeRes.valid).toBe(false);
    expect(hugeRes.error).toContain('exceeds the 8MB limit');

    // Empty 0-byte file
    const emptyRes = validatePaymentSlipFile({ size: 0, type: 'image/jpeg' });
    expect(emptyRes.valid).toBe(false);
    expect(emptyRes.error).toContain('empty');
  });

  it('validates registration state transitions lifecycle', () => {
    const mockRegistration: DbRunRegistration = {
      id: 'reg-lifecycle-001',
      reference: 'SR-ABC123',
      run_event_id: 'current-run-2027',
      category_id: 'cat-5k',
      user_id: 'usr-100',
      participant_name: 'Juan Dela Cruz',
      division: 'male',
      birth_date: '1995-04-12',
      mobile: '09171234567',
      locality: 'Guinacot, Guindulman',
      shirt_size: 'L',
      club_name: 'Bohol Striders',
      emergency_name: 'Maria Dela Cruz',
      emergency_relationship: 'Spouse',
      emergency_mobile: '09181234567',
      accessibility_notes: null,
      fee_centavos: 80000,
      currency: 'PHP',
      status: 'submitted',
      registration_email: 'juan@example.com',
      submitted_at: '2026-10-30T08:00:00Z',
      approved_at: null,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      bib_number: null,
      qr_token: null,
      registration_source: 'online',
      registered_by: null,
      created_at: '2026-10-30T08:00:00Z',
      updated_at: '2026-10-30T08:00:00Z',
    };

    // Helper checking eligibility for kit claim
    const isEligibleForKitClaim = (reg: DbRunRegistration): boolean => {
      return reg.status === 'approved' && Boolean(reg.bib_number);
    };

    // Unapproved registration cannot claim kit
    expect(isEligibleForKitClaim(mockRegistration)).toBe(false);

    // Transition to approved with assigned bib
    const approvedRegistration: DbRunRegistration = {
      ...mockRegistration,
      status: 'approved',
      bib_number: '5024',
      qr_token: 'qr-hash-9988',
      approved_at: '2026-10-30T09:00:00Z',
    };

    expect(isEligibleForKitClaim(approvedRegistration)).toBe(true);

    // Needs changes status cannot claim kit
    const needsChangesRegistration: DbRunRegistration = {
      ...mockRegistration,
      status: 'needs_changes',
    };
    expect(isEligibleForKitClaim(needsChangesRegistration)).toBe(false);

    // Rejected registration cannot claim kit
    const rejectedRegistration: DbRunRegistration = {
      ...mockRegistration,
      status: 'rejected',
    };
    expect(isEligibleForKitClaim(rejectedRegistration)).toBe(false);
  });
});
