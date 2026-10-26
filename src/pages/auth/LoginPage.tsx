import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isDemoAdmin, loading: authLoading, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get('next') || '';

  if (!authLoading && (user || isDemoAdmin)) {
    if (nextPath.startsWith('/')) return <Navigate to={nextPath} replace />;
    return <Navigate to={isAdmin || isDemoAdmin ? '/admin' : '/account'} replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Add your Supabase environment values to enable secure login.');
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
      // Role-aware redirect happens on next render via Navigate above;
      // also navigate explicitly for responsiveness.
      navigate(nextPath.startsWith('/') ? nextPath : '/account');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Sign in</p>
        <h1>Welcome back</h1>
        <p>Runners and committee staff use the same sign-in. Your role determines what you can access.</p>

        <form onSubmit={(e) => void submit(e)}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
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
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {!isSupabaseConfigured && (
          <button
            type="button"
            className="demo-link"
            onClick={() => {
              sessionStorage.setItem('sinoog-demo-admin', '1');
              navigate('/admin');
            }}
          >
            Preview administrator workspace
          </button>
        )}

        <small>
          <Link to="/signup">Create runner account</Link>
          {' · '}
          <Link to="/forgot-password">Forgot password</Link>
        </small>
      </div>
    </section>
  );
}