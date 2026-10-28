export type AuthErrorKind =
  | 'email_rate_limit'
  | 'request_rate_limit'
  | 'email_send_failed'
  | 'email_not_confirmed'
  | 'invalid_credentials'
  | 'other';

type AuthErrorLike = { message?: string; code?: string; status?: number } | null | undefined;

/**
 * Turns a Supabase Auth error into a readable message for runners and tells the screen which
 * kind of problem it was, so it can offer the right next step (resend, Google, try later).
 */
export function describeAuthError(
  error: AuthErrorLike,
  fallback = 'Something went wrong. Please try again.',
): { kind: AuthErrorKind; message: string } {
  const code = (error?.code ?? '').toLowerCase();
  const text = (error?.message ?? '').toLowerCase();

  if (code === 'over_email_send_rate_limit' || /email rate limit|too many emails/.test(text)) {
    return {
      kind: 'email_rate_limit',
      message:
        'We are receiving many sign-ups right now, so we cannot send an email at the moment. Please try again in a few minutes.',
    };
  }
  if (code === 'email_not_confirmed' || /email not confirmed/.test(text)) {
    return {
      kind: 'email_not_confirmed',
      message:
        'Your email address is not confirmed yet. Open the confirmation link we sent you, or request a new one.',
    };
  }
  if (code === 'invalid_credentials' || /invalid login credentials/.test(text)) {
    // Supabase gives the same answer for a wrong password and for an email with no account,
    // on purpose, so that nobody can find out which emails are registered.
    return { kind: 'invalid_credentials', message: 'Incorrect email or password.' };
  }
  if (/error sending/.test(text)) {
    return {
      kind: 'email_send_failed',
      message: 'We could not send the email right now. Please try again in a few minutes.',
    };
  }
  if (code === 'over_request_rate_limit' || /request rate limit/.test(text) || error?.status === 429) {
    return {
      kind: 'request_rate_limit',
      message: 'Too many attempts from this network. Please wait a few minutes and try again.',
    };
  }
  return { kind: 'other', message: error?.message?.trim() || fallback };
}