/**
 * Returns a normalised http(s) URL, or null when the value is empty or not a safe web address.
 * A value without a scheme (for example "facebook.com/page") is treated as https.
 * Schemes such as javascript:, data: or file: are always rejected.
 */
export function toSafeHttpUrl(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** For admin forms: empty becomes null, a valid address is normalised, anything else throws. */
export function requireOptionalHttpUrl(value: string | null | undefined, label: string): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const safe = toSafeHttpUrl(raw);
  if (!safe) throw new Error(`${label} must be a valid web address such as https://example.com.`);
  return safe;
}
