import { describe, expect, it } from 'vitest';
import {
  formatActivityDateTime,
  getActivityDateKey,
  sortActivitiesByDateAndOrder,
} from './activityQueries';
import type { DbActivity } from '../../types';

describe('activityQueries — Scheduling, Manila Timezone & Ordering', () => {
  it('extracts Manila date key (YYYY-MM-DD) from UTC ISO timestamps', () => {
    // 2027-01-06T00:00:00Z is 2027-01-06 08:00 AM Manila time (UTC+8)
    expect(getActivityDateKey('2027-01-06T00:00:00Z')).toBe('2027-01-06');

    // 2027-01-05T18:00:00Z is 2027-01-06 02:00 AM Manila time (UTC+8)
    expect(getActivityDateKey('2027-01-05T18:00:00Z')).toBe('2027-01-06');

    // Fallback for missing/empty date returns empty string
    expect(getActivityDateKey(null)).toBe('');
    expect(getActivityDateKey('')).toBe('');
  });

  it('formats activity date and time in Philippine Time (Asia/Manila)', () => {
    // 2027-01-15T01:30:00Z -> 09:30 AM Manila time on Fiesta Day
    const formatted = formatActivityDateTime('2027-01-15T01:30:00Z');
    expect(formatted.time).toBe('9:30 AM');
    expect(formatted.date).toContain('January 15, 2027');
  });

  it('sorts activities primarily by Manila date and then by sort_order', () => {
    const sampleActivities: DbActivity[] = [
      {
        id: 'act-3',
        edition_id: 'ed-2027',
        title: 'Fiesta High Mass',
        type: 'mass',
        starts_at: '2027-01-15T01:30:00Z',
        ends_at: null,
        venue: 'Parish Church',
        description: null,
        celebrant: 'Most Rev. Bishop',
        status: 'published',
        sort_order: 2,
        created_by: null,
        updated_by: null,
        created_at: '2026-10-30T00:00:00Z',
        updated_at: '2026-10-30T00:00:00Z',
      },
      {
        id: 'act-1',
        edition_id: 'ed-2027',
        title: 'Novena Mass Day 1',
        type: 'mass',
        starts_at: '2027-01-06T00:00:00Z',
        ends_at: null,
        venue: 'Parish Church',
        description: null,
        celebrant: 'Fr. Pastor',
        status: 'published',
        sort_order: 1,
        created_by: null,
        updated_by: null,
        created_at: '2026-10-30T00:00:00Z',
        updated_at: '2026-10-30T00:00:00Z',
      },
      {
        id: 'act-2',
        edition_id: 'ed-2027',
        title: 'Fiesta Dawn Mass',
        type: 'mass',
        starts_at: '2027-01-15T01:30:00Z',
        ends_at: null,
        venue: 'Parish Church',
        description: null,
        celebrant: 'Fr. Guest',
        status: 'published',
        sort_order: 1,
        created_by: null,
        updated_by: null,
        created_at: '2026-10-30T00:00:00Z',
        updated_at: '2026-10-30T00:00:00Z',
      },
    ];

    const sorted = sortActivitiesByDateAndOrder(sampleActivities);

    // Jan 6 Novena Mass must be first
    expect(sorted[0].id).toBe('act-1');

    // Jan 15 Dawn Mass (sort_order 1) must come before High Mass (sort_order 2)
    expect(sorted[1].id).toBe('act-2');
    expect(sorted[2].id).toBe('act-3');
  });

  it('validates that activity end time cannot be before or equal to start time', () => {
    const validateScheduleTimes = (
      startsAt: string,
      endsAt: string | null | undefined
    ): { valid: boolean; error?: string } => {
      if (!endsAt) return { valid: true };
      const start = new Date(startsAt).getTime();
      const end = new Date(endsAt).getTime();

      if (isNaN(start) || isNaN(end)) {
        return { valid: false, error: 'Invalid date format.' };
      }

      if (end <= start) {
        return { valid: false, error: 'End time must be after the start time.' };
      }

      return { valid: true };
    };

    // Valid: 8:00 AM to 10:00 AM
    expect(
      validateScheduleTimes('2027-01-06T08:00:00+08:00', '2027-01-06T10:00:00+08:00').valid
    ).toBe(true);

    // Invalid: ends before start (8:00 AM to 7:30 AM)
    const backwards = validateScheduleTimes('2027-01-06T08:00:00+08:00', '2027-01-06T07:30:00+08:00');
    expect(backwards.valid).toBe(false);
    expect(backwards.error).toBe('End time must be after the start time.');

    // Invalid: equal start and end time (8:00 AM to 8:00 AM)
    const sameTime = validateScheduleTimes('2027-01-06T08:00:00+08:00', '2027-01-06T08:00:00+08:00');
    expect(sameTime.valid).toBe(false);
    expect(sameTime.error).toBe('End time must be after the start time.');

    // Valid: null end time (ongoing / open-ended activity)
    expect(validateScheduleTimes('2027-01-06T08:00:00+08:00', null).valid).toBe(true);
  });
});
