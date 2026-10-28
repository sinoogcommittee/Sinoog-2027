import { describe, expect, it } from 'vitest';
import { describeAuthError } from './authErrors';

describe('describeAuthError', () => {
  it('recognises the email sending limit by code and by message', () => {
    expect(describeAuthError({ code: 'over_email_send_rate_limit', message: 'x', status: 429 }).kind).toBe(
      'email_rate_limit',
    );
    expect(describeAuthError({ message: 'email rate limit exceeded' }).kind).toBe('email_rate_limit');
  });

  it('recognises an unconfirmed email', () => {
    expect(describeAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed' }).kind).toBe(
      'email_not_confirmed',
    );
  });

  it('recognises a failed email send', () => {
    expect(describeAuthError({ message: 'Error sending confirmation email', status: 500 }).kind).toBe(
      'email_send_failed',
    );
  });

  it('treats other 429 responses as a per-network limit', () => {
    expect(describeAuthError({ message: 'Request rate limit reached', status: 429 }).kind).toBe(
      'request_rate_limit',
    );
  });

  it('recognises a wrong password or an email with no account', () => {
    expect(describeAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toEqual({
      kind: 'invalid_credentials',
      message: 'Incorrect email or password.',
    });
    expect(describeAuthError({ message: 'Invalid login credentials' }).kind).toBe('invalid_credentials');
  });

  it('keeps the original message for other errors', () => {
    expect(describeAuthError({ message: 'User not allowed' })).toEqual({
      kind: 'other',
      message: 'User not allowed',
    });
  });

  it('uses the fallback when there is no message', () => {
    expect(describeAuthError(null, 'Try again.')).toEqual({ kind: 'other', message: 'Try again.' });
  });
});