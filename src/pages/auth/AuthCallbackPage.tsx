/**
 * Sinoog 2027 — OAuth / email-link callback handler (P1-016 M3 upgrade)
 *
 * Handles code exchange for:
 *  - Email confirmation links
 *  - OAuth sign-in (Google)
 *  - Password-reset links (redirects to /auth/reset-password)
 *  - Magic link sign-in
 *
 * Upgraded to use M3 LoadingState and InlineMessage feedback components.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';
import { LoadingState, InlineMessage } from '../../features/ui/FeedbackStates';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const requestedPath = searchParams.get('next');

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      if (!supabase) {
        if (active) setError('Supabase is not configured in this environment.');
        return;
      }

      try {
        // Exchange PKCE code (email link / OAuth redirect) if present in the URL.
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          if (codeError) throw codeError;
        } else {
          const { error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
        }

        const { data: sessionData, error: sessionCheckError } =
          await supabase.auth.getSession();
        if (sessionCheckError) throw sessionCheckError;

        await refresh();
        if (!active) return;

        // Safe redirect: only allow absolute paths on the same origin.
        const safeNext =
          requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
            ? requestedPath
            : null;
        let destination = safeNext ?? '/account';

        // Promote admin users directly to the workspace when no explicit next param.
        if (!safeNext && sessionData.session?.user.id) {
          const { data: adminRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', sessionData.session.user.id)
            .eq('role', 'admin')
            .maybeSingle();
          if (adminRole) destination = '/admin';
        }

        navigate(destination, { replace: true });
      } catch (err: unknown) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : 'Unable to complete sign-in from this link.'
        );
      }
    }

    void handleCallback();
    return () => {
      active = false;
    };
  }, [navigate, refresh, requestedPath]);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Authentication</p>
        <h1>Finishing sign-in</h1>

        {error ? (
          <>
            <InlineMessage tone="error">{error}</InlineMessage>
            <small style={{ marginTop: 16, display: 'block' }}>
              <Link to="/forgot-password">Request a new recovery link</Link>
              {' · '}
              <Link to="/login">Return to sign in</Link>
            </small>
          </>
        ) : (
          <LoadingState message="Confirming your session…" />
        )}
      </div>
    </section>
  );
}
