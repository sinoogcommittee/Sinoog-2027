import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const [message, setMessage] = useState('Confirming your session…');
  const requestedPath = searchParams.get('next');

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      if (!supabase) {
        if (active) setMessage('Supabase is not configured in this environment.');
        return;
      }

      try {
        // Exchange code from email link / OAuth-style redirect if present
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        await refresh();
        if (!active) return;

        const safeRequestedPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
          ? requestedPath
          : null;
        let destination = safeRequestedPath || '/account';

        if (!safeRequestedPath && sessionData.session?.user.id) {
          const { data: adminRole } = await supabase.from('user_roles').select('role')
            .eq('user_id', sessionData.session.user.id).eq('role', 'admin').maybeSingle();
          if (adminRole) destination = '/admin';
        }
        navigate(destination, { replace: true });
      } catch (err: unknown) {
        if (!active) return;
        setMessage(err instanceof Error ? err.message : 'Unable to complete sign-in from this link.');
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
        <p className="form-message">{message}</p>
        <small>
          <Link to="/login">Return to sign in</Link>
        </small>
      </div>
    </section>
  );
}
