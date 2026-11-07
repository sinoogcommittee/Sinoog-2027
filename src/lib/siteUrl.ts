export const PRODUCTION_SITE_URL = 'https://sinoog2027.onrender.com';

/**
 * Returns the base URL for public shareable links (e.g. staff invite links).
 * If the current environment is running on localhost, 127.0.0.1, or a local LAN IP,
 * it returns the official production URL (https://sinoog2027.onrender.com) so that links copied
 * by an administrator on their development computer will work on any phone, tablet, or external device.
 */
export function getShareableBaseUrl(): string {
  if (typeof window === 'undefined') {
    return PRODUCTION_SITE_URL;
  }
  const hostname = window.location.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  ) {
    return PRODUCTION_SITE_URL;
  }
  return window.location.origin;
}

/**
 * Builds the canonical staff invite link for an invite code.
 */
export function getStaffInviteLink(code: string): string {
  const base = getShareableBaseUrl();
  return `${base}/join-staff?code=${encodeURIComponent(code.trim().toUpperCase())}`;
}
