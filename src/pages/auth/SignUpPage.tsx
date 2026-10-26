import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/useAuth';

export function SignUpPage() {
  const { user, loading: authLoading } = useAuth();
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
    return <Navigate to="/account" replace />;
  }

  async function submit(e: FormEvent) {
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
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      // Best-effort profile upsert when session is available (email confirmation may delay it)
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
      setMessage(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Runner account</p>
        <h1>Create your account</h1>
        <p>
          Register once to submit your Sinoog Run entry, upload payment proof, and track approval status.
        </p>

        {success ? (
          <div className="form-message" role="status">
            <p>
              <strong>Check your email.</strong> We sent a confirmation link to <em>{email}</em>. Open it to
              activate your account, then sign in to continue registration.
            </p>
            <p style={{ marginTop: '1rem' }}>
              <Link to="/login">Go to sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
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
              Locality / barangay
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
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        )}

        <small>
          Already have an account? <Link to="/login">Sign in</Link>
          {' · '}
          <Link to="/privacy">Privacy</Link>
          {' · '}
          <Link to="/terms">Terms</Link>
        </small>
      </div>
    </section>
  );
}