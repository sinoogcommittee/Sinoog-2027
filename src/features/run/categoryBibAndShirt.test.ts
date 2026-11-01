import { describe, expect, it } from 'vitest';
import { formatShirtSelection, parseShirtSelection, getBibCategoryLabel } from './runQueries';

describe('Category-Specific Bib Numbers & Shirt Selection', () => {
  it('formats and parses shirt selections correctly for Singlet and Full Sublimation', () => {
    expect(formatShirtSelection('full_sub', 'L')).toBe('Full Sub (L)');
    expect(formatShirtSelection('singlet', 'M')).toBe('Singlet (M)');
    expect(formatShirtSelection('full_sub', '2XL')).toBe('Full Sub (2XL)');

    expect(parseShirtSelection('Full Sub (L)')).toEqual({ style: 'full_sub', size: 'L' });
    expect(parseShirtSelection('Singlet (M)')).toEqual({ style: 'singlet', size: 'M' });
    expect(parseShirtSelection('Full Sublimation (2XL)')).toEqual({ style: 'full_sub', size: '2XL' });
    expect(parseShirtSelection('M')).toEqual({ style: 'singlet', size: 'M' });
    expect(parseShirtSelection(null)).toEqual({ style: 'singlet', size: 'M' });
  });

  it('generates correct category labels for printed race bibs', () => {
    expect(getBibCategoryLabel('3K Fun Run / Family Walk')).toEqual({
      title: '3KM FUN RUN',
      subtitle: 'CATEGORY',
    });
    expect(getBibCategoryLabel('5K Community Stride')).toEqual({
      title: '5KM STRIDE',
      subtitle: 'CATEGORY',
    });
    expect(getBibCategoryLabel('10K Sto. Niño Fiesta Loop')).toEqual({
      title: '10KM FIESTA LOOP',
      subtitle: 'CATEGORY',
    });
    expect(getBibCategoryLabel(null)).toEqual({
      title: 'SINOOG RUN 2027',
      subtitle: 'CATEGORY',
    });
  });

  it('validates 3K, 5K, and 10K bib number formats', () => {
    const bibPattern3K = /^3[0-9]{3}$/; // 3001-3999
    const bibPattern5K = /^5[0-9]{3}$/; // 5001-5999
    const bibPattern10K = /^10[0-9]{3}$/; // 10001-10999

    expect(bibPattern3K.test('3001')).toBe(true);
    expect(bibPattern3K.test('3999')).toBe(true);
    expect(bibPattern3K.test('4001')).toBe(false);

    expect(bibPattern5K.test('5001')).toBe(true);
    expect(bibPattern5K.test('5024')).toBe(true);
    expect(bibPattern5K.test('5999')).toBe(true);
    expect(bibPattern5K.test('6001')).toBe(false);

    expect(bibPattern10K.test('10001')).toBe(true);
    expect(bibPattern10K.test('10999')).toBe(true);
    expect(bibPattern10K.test('11000')).toBe(false);
  });
});
