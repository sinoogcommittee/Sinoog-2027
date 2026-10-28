import { describe, expect, it } from 'vitest';
import { safeNextPath } from './safeNext';

describe('safeNextPath', () => {
  it('keeps normal same-site paths', () => {
    expect(safeNextPath('/run/register')).toBe('/run/register');
    expect(safeNextPath('/account?tab=entry')).toBe('/account?tab=entry');
  });

  it('rejects other sites and tricks', () => {
    expect(safeNextPath('//example.com')).toBe('/account');
    expect(safeNextPath('/\\example.com')).toBe('/account');
    expect(safeNextPath('https://example.com')).toBe('/account');
    expect(safeNextPath('javascript:alert(1)')).toBe('/account');
    expect(safeNextPath('/ok\u0000bad')).toBe('/account');
  });

  it('uses the fallback for empty values', () => {
    expect(safeNextPath('')).toBe('/account');
    expect(safeNextPath(null)).toBe('/account');
    expect(safeNextPath(undefined, '')).toBe('');
  });
});