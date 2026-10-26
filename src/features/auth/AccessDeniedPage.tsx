import { Link } from 'react-router-dom';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from './useAuth';

export function AccessDeniedPage({
  requiredRole = 'administrator',
  reason,
}: {
  requiredRole?: string;
  reason?: string;
}) {
  const { user, isSuspended, signOut } = useAuth();

  return (
    <section className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--color-wine-50, #fdf2f2)', color: 'var(--color-wine, #781d22)', marginBottom: '1rem' }}>
          <ShieldAlert size={40} />
        </div>
        <p className="eyebrow">Access restriction</p>
        <h1>{isSuspended ? 'Account Suspended' : 'Access Denied'}</h1>
        <p>
          {isSuspended
            ? 'Your account has been temporarily suspended by an administrator. Please contact the Sinoog Committee.'
            : reason || `This workspace requires ${requiredRole} permissions. Your current account does not have authorization to view this resource.`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', width: '100%' }}>
          {user ? (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void signOut()}
              style={{ justifyContent: 'center' }}
            >
              <LogIn size={16} /> Sign in with different account
            </button>
          ) : (
            <Link to="/login" className="button button--primary" style={{ justifyContent: 'center' }}>
              <LogIn size={16} /> Sign in
            </Link>
          )}
          <Link to="/" className="button button--ghost" style={{ justifyContent: 'center' }}>
            <ArrowLeft size={16} /> Return to homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
