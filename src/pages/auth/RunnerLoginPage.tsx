import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';

export function RunnerLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isDemoAdmin, loading: authLoading, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get('next') || '';

  if (!authLoading && (user || isDemoAdmin)) {
    if (isAdmin || isDemoAdmin) return <Navigate to="/admin" replace />;
    if (nextPath.startsWith('/')) return <Navigate to={nextPath} replace />;
    return <Navigate to="/account" replace />;
  }

  async function submit(e: FormEvent) {
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

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Sinoog Run</p>
        <h1>Runner sign in</h1>
        <p>Sign in to register for the run, submit payment proof, or view your entry status.</p>

        <form onSubmit={(e) => void submit(e)}>
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

        <small>
          <Link to="/signup">Create runner account</Link>
          {' · '}
          <Link to="/forgot-password">Forgot password</Link>
        </small>
        <small style={{ display: 'block', marginTop: '0.75rem' }}>
          Committee website access is separate. <Link to="/login">Staff login</Link>
        </small>
      </div>
    </section>
  );
}