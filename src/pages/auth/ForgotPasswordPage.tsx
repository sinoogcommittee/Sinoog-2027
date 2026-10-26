import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Add your Supabase environment values to enable password recovery.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setSent(true);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Forgot password</h1>
        <p>Enter the email on your Sinoog account. We will send a secure link to choose a new password.</p>

        {sent ? (
          <div className="form-message" role="status">
            <p>
              If an account exists for <em>{email}</em>, a reset link is on its way. Check your inbox and spam
              folder.
            </p>
            <p style={{ marginTop: '1rem' }}>
              <Link to="/login">Back to sign in</Link>
            </p>
          </div>
        ) : (
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
            {message && <p className="form-message">{message}</p>}
            <Button type="submit" disabled={loading || !isSupabaseConfigured}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <small>
          <Link to="/login">Sign in</Link>
          {' · '}
          <Link to="/signup">Create account</Link>
        </small>
      </div>
    </section>
  );
}