import { describe, expect, it } from 'vitest';
import { getShareableBaseUrl, getStaffInviteLink, PRODUCTION_SITE_URL } from './siteUrl';

describe('siteUrl', () => {
  it('returns production URL by default in non-browser or localhost environments', () => {
    const url = getShareableBaseUrl();
    expect(url).toBe(PRODUCTION_SITE_URL);
  });

  it('builds canonical staff invite links with capitalized code', () => {
    const link = getStaffInviteLink('sinoog-123456');
    expect(link).toBe('https://sinoog2027.onrender.com/join-staff?code=SINOOG-123456');
  });

  it('trims whitespace on code', () => {
    const link = getStaffInviteLink('  sinoog-abc789  ');
    expect(link).toBe('https://sinoog2027.onrender.com/join-staff?code=SINOOG-ABC789');
  });
});
