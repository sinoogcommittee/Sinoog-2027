/**
 * Returns a same-site path that is safe to open after signing in, or the fallback.
 * Rejects addresses on other sites such as "//example.com" or "/\example.com", and anything
 * containing control characters.
 */
export function safeNextPath(value: string | null | undefined, fallback = '/account'): string {
  const path = (value ?? '').trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback;
  for (const character of path) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) return fallback;
  }
  return path;
}