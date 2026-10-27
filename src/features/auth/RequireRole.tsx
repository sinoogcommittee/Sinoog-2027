import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { AccessDeniedPage } from './AccessDeniedPage';
import { LoadingState } from '../ui/FeedbackStates';

type RequiredRole = 'admin' | 'staff' | 'news_in_charge' | 'delegation_head' | 'public_user';

export function RequireRole({ role = 'admin' }: { role?: RequiredRole }) {
  const { user, isDemoAdmin, isAdmin, isNewsInCharge, isDelegationHead, loading, isSuspended } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <LoadingState message="Verifying account authorization…" />
      </div>
    );
  }

  if (isSuspended) {
    return <AccessDeniedPage reason="Your account has been suspended by an administrator." />;
  }

  const hasAccess =
    isAdmin ||
    (role === 'staff' && (isNewsInCharge || isDelegationHead)) ||
    (role === 'news_in_charge' && isNewsInCharge) ||
    (role === 'delegation_head' && isDelegationHead) ||
    (role === 'public_user' && Boolean(user || isDemoAdmin));

  if (!user && !isDemoAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return (
      <AccessDeniedPage
        requiredRole={role}
        reason={role === 'staff' ? 'A committee staff role is required to open this workspace.' : undefined}
      />
    );
  }

  return <Outlet />;
}

export function RequireAdmin() {
  return <RequireRole role="admin" />;
}
