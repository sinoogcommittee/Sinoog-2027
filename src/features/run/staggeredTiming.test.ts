import { describe, expect, it } from 'vitest';
import {
  formatElapsed,
  getCategoryPlannedStart,
  getCategoryBadgeStyle,
} from './runQueries';

describe('Staggered Category Gun Starts & Race Timing', () => {
  it('correctly maps planned gun starts for 10K, 5K, and 3K categories', () => {
    expect(getCategoryPlannedStart({ name: '10K Sto. Niño Fiesta Loop' })).toBe('4:00 AM');
    expect(getCategoryPlannedStart({ name: '5K Community Stride' })).toBe('4:30 AM');
    expect(getCategoryPlannedStart({ name: '3K Fun Run / Family Walk' })).toBe('5:00 AM');
  });

  it('respects explicitly configured planned_start_time in database', () => {
    expect(getCategoryPlannedStart({ name: 'Special Category', planned_start_time: '04:15:00' })).toBe('4:15 AM');
    expect(getCategoryPlannedStart({ name: 'Evening Run', planned_start_time: '17:30:00' })).toBe('5:30 PM');
  });

  it('assigns themed badge styles matching route color accents', () => {
    const badge10k = getCategoryBadgeStyle('10K Sto. Niño Fiesta Loop');
    expect(badge10k.label).toBe('10K');
    expect(badge10k.color).toBe('#e65100'); // Fiery orange

    const badge5k = getCategoryBadgeStyle('5K Community Stride');
    expect(badge5k.label).toBe('5K');
    expect(badge5k.color).toBe('#1565c0'); // Electric blue

    const badge3k = getCategoryBadgeStyle('3K Fun Run / Family Walk');
    expect(badge3k.label).toBe('3K');
    expect(badge3k.color).toBe('#2e7d32'); // Emerald green
  });

  it('computes accurate staggered elapsed times per category start', () => {
    // 10K gun start: 04:00:00
    const start10k = new Date('2027-01-09T04:00:00+08:00').getTime();
    // 5K gun start: 04:30:00
    const start5k = new Date('2027-01-09T04:30:00+08:00').getTime();
    // 3K gun start: 05:00:00
    const start3k = new Date('2027-01-09T05:00:00+08:00').getTime();

    // Runner A (10K) finishes at 04:55:30 (elapsed: 55m 30s)
    const finish10k = new Date('2027-01-09T04:55:30+08:00').getTime();
    const elapsed10k = finish10k - start10k;
    expect(formatElapsed(elapsed10k)).toBe('00:55:30');

    // Runner B (5K) finishes at 04:58:15 (elapsed: 28m 15s)
    const finish5k = new Date('2027-01-09T04:58:15+08:00').getTime();
    const elapsed5k = finish5k - start5k;
    expect(formatElapsed(elapsed5k)).toBe('00:28:15');

    // Runner C (3K) finishes at 05:18:05 (elapsed: 18m 05s)
    const finish3k = new Date('2027-01-09T05:18:05+08:00').getTime();
    const elapsed3k = finish3k - start3k;
    expect(formatElapsed(elapsed3k)).toBe('00:18:05');
  });
});
