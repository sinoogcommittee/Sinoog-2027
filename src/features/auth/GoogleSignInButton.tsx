import { useState } from 'react';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

type Props = {
  nextPath?: string;
  onError: (message: string) => void;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.01v2.54h3.24c1.9-1.74 2.98-4.31 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.37l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.38 3.13 1.04 4.54l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5L18.7 4.6A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z" />
    </svg>
  );
}

export function GoogleSignInButton({ nextPath = '/account', onError }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    onError('');
    if (!supabase || !isSupabaseConfigured) {
      onError('Supabase must be configured before Google sign-in can be used.');
      return;
    }

    const safeNext = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/account';
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', safeNext);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });
      if (error) onError(error.message);
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : 'Unable to continue with Google.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="google-sign-in"
      disabled={loading || !isSupabaseConfigured}
      onClick={() => void handleGoogleLogin()}
    >
      <GoogleMark />
      {loading ? 'Opening Google…' : 'Continue with Google'}
    </Button>
  );
}
