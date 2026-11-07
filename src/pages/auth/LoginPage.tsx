import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { TextField } from '../../components/m3/TextField';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';
import { describeAuthError } from '../../lib/authErrors';

export function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    isStaff,
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

  const hasStaffAccess = isStaff || isAdmin || isNewsInCharge || isDelegationHead || isDemoAdmin;

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
        setMessage(describeAuthError(error).message);
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
          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {message && <p className="form-message">{message}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in to workspace'}
          </Button>
        </form>

        <div style={{ marginTop: '20px', padding: '16px', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
          <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Have an invite code?</strong>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.84rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Committee members invited by the Super Administrator can sign up automatically using their Google account.
          </p>
          <Link to="/join-staff" className="button button--outlined button--sm" style={{ display: 'inline-block' }}>
            Join with Google & Invite Code
          </Link>
        </div>

        {import.meta.env.DEV && !isSupabaseConfigured && (
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