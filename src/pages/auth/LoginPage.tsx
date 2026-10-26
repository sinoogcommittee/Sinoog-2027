import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    isDemoAdmin,
    isNewsInCharge,
    isDelegationHead,
    loading: authLoading,
    refresh,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const hasStaffAccess = isAdmin || isNewsInCharge || isDelegationHead || isDemoAdmin;

  if (!authLoading && user) {
    if (hasStaffAccess) return <Navigate to="/admin" replace />;
    return <Navigate to="/account" replace />;
  }
  if (!authLoading && isDemoAdmin) {
    return <Navigate to="/admin" replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Add your Supabase environment values to enable staff login.');
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
      navigate('/admin');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Committee access</p>
        <h1>Staff sign in</h1>
        <p>
          Sign in to manage website content, schedules, site settings, and run operations. Accounts are assigned by an
          administrator — there is no public staff registration.
        </p>

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
            {loading ? 'Signing in…' : 'Sign in to workspace'}
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
          <Link to="/forgot-password">Forgot password</Link>
        </small>
        <div className="runner-auth-prompt">
          <span>Registering for the Sinoog Run?</span>
          <div className="runner-auth-prompt__links">
            <Link to="/signin">Runner sign in</Link>
            <Link to="/signin?mode=signup">Create runner account</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
