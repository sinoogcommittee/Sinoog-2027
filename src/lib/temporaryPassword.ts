// No 0, O, 1, l or I, so a password read aloud or written down is not misread.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function randomPassword(length: number): string {
  // Rejection sampling keeps every character equally likely.
  const unbiasedLimit = 256 - (256 % ALPHABET.length);
  let result = '';
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const byte of bytes) {
      if (byte >= unbiasedLimit) continue;
      result += ALPHABET[byte % ALPHABET.length];
      if (result.length === length) break;
    }
  }
  return result;
}

/** A random temporary password with at least one capital letter, one small letter and one digit. */
export function generateTemporaryPassword(length = 14): string {
  let password = randomPassword(length);
  while (!(/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password))) {
    password = randomPassword(length);
  }
  return password;
}