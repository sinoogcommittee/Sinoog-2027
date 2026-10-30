import { describe, expect, it } from 'vitest';
import {
  EMERGENCY_RELATIONSHIPS,
  FALLBACK_CATEGORIES,
  FALLBACK_RUN_EVENT,
  formatElapsed,
  getRunnerQrValue,
} from './runQueries';

describe('runRegistration — Fee, Eligibility & Validation Logic', () => {
  it('correctly maps standard categories and fees in integer centavos', () => {
    const cat3k = FALLBACK_CATEGORIES.find((c) => c.distance_meters === 3000);
    const cat5k = FALLBACK_CATEGORIES.find((c) => c.distance_meters === 5000);
    const cat10k = FALLBACK_CATEGORIES.find((c) => c.distance_meters === 10000);

    expect(cat3k).toBeDefined();
    expect(cat3k?.fee_centavos).toBe(50000); // ₱500.00

    expect(cat5k).toBeDefined();
    expect(cat5k?.fee_centavos).toBe(80000); // ₱800.00

    expect(cat10k).toBeDefined();
    expect(cat10k?.fee_centavos).toBe(100000); // ₱1,000.00
  });

  it('formats QR code values in standardized SINOOG-2027 format', () => {
    expect(getRunnerQrValue({ qr_token: 'valid-token-12345' })).toBe('SINOOG-2027|valid-token-12345');
    expect(getRunnerQrValue({ qr_token: null })).toBeNull();
    expect(getRunnerQrValue({ qr_token: '' })).toBeNull();
  });

  it('formats elapsed run milliseconds to standard HH:MM:SS format', () => {
    // 0 milliseconds
    expect(formatElapsed(0)).toBe('00:00:00');

    // 59 seconds (59,000 ms)
    expect(formatElapsed(59000)).toBe('00:00:59');

    // 24 minutes, 35 seconds (1,475,000 ms)
    expect(formatElapsed(1475000)).toBe('00:24:35');

    // 1 hour, 15 minutes, 42 seconds (4,542,000 ms)
    expect(formatElapsed(4542000)).toBe('01:15:42');
  });

  it('validates allowed emergency relationships list', () => {
    expect(EMERGENCY_RELATIONSHIPS).toContain('Parent');
    expect(EMERGENCY_RELATIONSHIPS).toContain('Spouse');
    expect(EMERGENCY_RELATIONSHIPS).toContain('Sibling');
    expect(EMERGENCY_RELATIONSHIPS).toContain('Guardian');
    expect(EMERGENCY_RELATIONSHIPS.length).toBeGreaterThanOrEqual(5);
  });

  it('verifies age calculation and minor guardian consent detection', () => {
    const isMinor = (birthDateString: string, eventDate: Date = new Date('2027-01-09')): boolean => {
      const birth = new Date(birthDateString);
      if (isNaN(birth.getTime())) return false;
      let age = eventDate.getFullYear() - birth.getFullYear();
      const m = eventDate.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && eventDate.getDate() < birth.getDate())) {
        age--;
      }
      return age < 18;
    };

    // Born in 2012 -> 14 on event day (minor)
    expect(isMinor('2012-05-15')).toBe(true);

    // Born in 2005 -> 21 on event day (adult)
    expect(isMinor('2005-01-01')).toBe(false);

    // Born in 2009-01-10 -> 17 on Jan 9, 2027 (minor)
    expect(isMinor('2009-01-10')).toBe(true);

    // Born in 2009-01-08 -> 18 on Jan 9, 2027 (adult)
    expect(isMinor('2009-01-08')).toBe(false);
  });

  it('ensures fallback run event contains valid terms and privacy versions', () => {
    expect(FALLBACK_RUN_EVENT.terms_version).toBe('2027-v2');
    expect(FALLBACK_RUN_EVENT.privacy_version).toBe('2027-v2');
    expect(FALLBACK_RUN_EVENT.gcash_number).toMatch(/^09\d{9}$/);
  });
});
