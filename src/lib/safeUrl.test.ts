import { describe, expect, it } from 'vitest';
import { requireOptionalHttpUrl, toSafeHttpUrl } from './safeUrl';

describe('toSafeHttpUrl', () => {
  it('keeps normal https and http addresses', () => {
    expect(toSafeHttpUrl('https://www.facebook.com/Sto.NinoParishGuinacot')).toBe(
      'https://www.facebook.com/Sto.NinoParishGuinacot',
    );
    expect(toSafeHttpUrl('http://example.com/page')).toBe('http://example.com/page');
  });

  it('adds https when the scheme is missing', () => {
    expect(toSafeHttpUrl('facebook.com/yourpage')).toBe('https://facebook.com/yourpage');
  });

  it('rejects script, data and file schemes', () => {
    expect(toSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeHttpUrl('JaVaScRiPt:alert(1)')).toBeNull();
    expect(toSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(toSafeHttpUrl('file:///etc/passwd')).toBeNull();
  });

  it('returns null for empty or malformed values', () => {
    expect(toSafeHttpUrl('')).toBeNull();
    expect(toSafeHttpUrl('   ')).toBeNull();
    expect(toSafeHttpUrl(null)).toBeNull();
    expect(toSafeHttpUrl('not a url')).toBeNull();
  });
});

describe('requireOptionalHttpUrl', () => {
  it('turns an empty value into null', () => {
    expect(requireOptionalHttpUrl('  ', 'Website')).toBeNull();
  });

  it('normalises a valid address', () => {
    expect(requireOptionalHttpUrl('example.com/sponsor', 'Website')).toBe('https://example.com/sponsor');
  });

  it('throws a readable error for an unsafe address', () => {
    expect(() => requireOptionalHttpUrl('javascript:alert(1)', 'Facebook page')).toThrow(
      'Facebook page must be a valid web address',
    );
  });
});
