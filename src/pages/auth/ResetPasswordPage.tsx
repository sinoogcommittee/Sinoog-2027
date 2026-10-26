import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Add your Supabase environment values to enable password reset.');
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage('Password updated. Redirecting…');
      setTimeout(() => navigate('/account', { replace: true }), 800);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Choose a new password</h1>
        <p>Open this page from the email link, then set a new password for your account.</p>

        <form onSubmit={(e) => void submit(e)}>
          <label>
            New password
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
            Confirm new password
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
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </form>

        <small>
          <Link to="/login">Back to sign in</Link>
        </small>
      </div>
    </section>
  );
}