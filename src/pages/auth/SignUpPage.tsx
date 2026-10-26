import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';

export function SignUpPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [locality, setLocality] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/account" replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Add your Supabase environment values to enable runner account creation.');
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
        <h1>Create a runner account</h1>
        <p>
          Sign up to register for the Sinoog Run, upload payment proof, and track your entry status. This is not
          committee website access.
        </p>

        {success ? (
          <div className="form-message" role="status">
            <p>
              <strong>Check your email.</strong> We sent a confirmation link to <em>{email}</em>. After confirming,
              sign in to continue your run registration.
            </p>
            <p style={{ marginTop: '1rem' }}>
              <Link to="/runner/login">Runner sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
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
                autoComplete="address-level2"
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
          Already registered as a runner? <Link to="/runner/login">Sign in</Link>
          {' · '}
          <Link to="/privacy">Privacy</Link>
          {' · '}
          <Link to="/terms">Terms</Link>
        </small>
        <small style={{ display: 'block', marginTop: '0.75rem' }}>
          Committee staff use a separate sign-in. <Link to="/login">Staff login</Link>
        </small>
      </div>
    </section>
  );
}