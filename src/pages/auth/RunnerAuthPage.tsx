import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';
import { GoogleSignInButton } from '../../features/auth/GoogleSignInButton';

type Mode = 'signin' | 'signup';

export function RunnerAuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin, isDemoAdmin, loading: authLoading, refresh } = useAuth();

  const mode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const nextPath = searchParams.get('next') || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [locality, setLocality] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === 'signup' ? 'Create a runner account' : 'Runner sign in'),
    [mode]
  );

  if (!authLoading && (user || isDemoAdmin)) {
    if (isAdmin || isDemoAdmin) return <Navigate to="/admin" replace />;
    if (nextPath.startsWith('/')) return <Navigate to={nextPath} replace />;
    return <Navigate to="/account" replace />;
  }

  function setMode(next: Mode) {
    setMessage('');
    setSuccess(false);
    const params = new URLSearchParams(searchParams);
    if (next === 'signup') params.set('mode', 'signup');
    else params.delete('mode');
    setSearchParams(params, { replace: true });
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Add your Supabase environment values to enable runner sign-in.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      await refresh();
      navigate(nextPath.startsWith('/') ? nextPath : '/account');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Add your Supabase environment values to enable account creation.');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
            mobile: mobile.trim(),
            locality: locality.trim(),
            account_purpose: 'runner',
          },
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim() || null,
          mobile: mobile.trim() || null,
          locality: locality.trim() || null,
        });
      }
      setSuccess(true);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to create runner account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Sinoog Run 2027</p>
        <h1>{title}</h1>
        <p>
          {mode === 'signup'
            ? 'Create an account to register for the run, upload payment proof, and track your entry.'
            : 'Sign in to register for the run or view your entry status.'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.35rem',
            marginBottom: '1.25rem',
            background: '#f5efe6',
            padding: '0.35rem',
            borderRadius: '8px',
          }}
          role="tablist"
          aria-label="Runner account"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={mode === 'signin' ? 'button button--primary button--sm' : 'button button--ghost button--sm'}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'button button--primary button--sm' : 'button button--ghost button--sm'}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <GoogleSignInButton
          nextPath={nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/account'}
          onError={setMessage}
        />
        <div className="auth-divider"><span>or continue with email</span></div>

        {success && mode === 'signup' ? (
          <div className="form-message" role="status">
            <p>
              <strong>Check your email.</strong> We sent a confirmation link to <em>{email}</em>. After confirming,
              return here to sign in.
            </p>
            <p style={{ marginTop: '1rem' }}>
              <button type="button" className="button button--secondary button--sm" onClick={() => setMode('signin')}>
                Back to sign in
              </button>
            </p>
          </div>
        ) : mode === 'signin' ? (
          <form onSubmit={(e) => void handleSignIn(e)}>
            <label>
              Email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            {message && <p className="form-message">{message}</p>}
            <Button type="submit" disabled={loading || !isSupabaseConfigured}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleSignUp(e)}>
            <label>
              Full name
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            </label>
            <label>
              Email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label>
              Mobile number
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                autoComplete="tel"
                placeholder="09XXXXXXXXX"
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                required
                autoComplete="street-address"
                placeholder="House/Street, Barangay, Municipality, Province"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            {message && <p className="form-message">{message}</p>}
            <Button type="submit" disabled={loading || !isSupabaseConfigured}>
              {loading ? 'Creating account…' : 'Create runner account'}
            </Button>
          </form>
        )}

        <small>
          {mode === 'signin' ? (
            <>
              <Link to="/forgot-password">Forgot password</Link>
              {' · '}
              New runner?{' '}
              <button
                type="button"
                className="demo-link"
                style={{ display: 'inline', padding: 0 }}
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="demo-link"
                style={{ display: 'inline', padding: 0 }}
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
              {' · '}
              <Link to="/privacy">Privacy</Link>
            </>
          )}
        </small>
        <small style={{ display: 'block', marginTop: '0.75rem' }}>
          Committee staff use a separate login. <Link to="/login">Staff login</Link>
        </small>
      </div>
    </section>
  );
}
