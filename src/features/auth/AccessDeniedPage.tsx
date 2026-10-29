import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from './useAuth';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';

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
      <Card variant="outlined" className="auth-card" style={{ maxWidth: '480px', textAlign: 'center', margin: '0 auto', padding: 'var(--md-space-6)' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', marginBottom: '1rem' }}>
          <ShieldAlert size={40} />
        </div>
        <p className="eyebrow">Access restriction</p>
        <h1 style={{ margin: 'var(--md-space-2) 0', fontSize: '1.75rem' }}>{isSuspended ? 'Account Suspended' : 'Access Denied'}</h1>
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {isSuspended
            ? 'Your account has been temporarily suspended by an administrator. Please contact the Sinoog Committee.'
            : reason || `This workspace requires ${requiredRole} permissions. Your current account does not have authorization to view this resource.`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', width: '100%' }}>
          {user ? (
            <Button
              variant="outlined"
              onClick={() => void signOut()}
              leadingIcon={<LogIn size={16} />}
              style={{ justifyContent: 'center' }}
            >
              Sign in with different account
            </Button>
          ) : (
            <Button
              variant="filled"
              to="/login"
              leadingIcon={<LogIn size={16} />}
              style={{ justifyContent: 'center' }}
            >
              Sign in
            </Button>
          )}
          <Button
            variant="text"
            to="/"
            leadingIcon={<ArrowLeft size={16} />}
            style={{ justifyContent: 'center' }}
          >
            Return to homepage
          </Button>
        </div>
      </Card>
    </section>
  );
}
