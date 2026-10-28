import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { AccessDeniedPage } from './AccessDeniedPage';
import { LoadingState } from '../ui/FeedbackStates';

/**
 * Sends a visitor who is not signed in to the runner sign-in page, then back to the page they
 * asked for. Used for pages that must not be filled in anonymously, such as run registration.
 * A suspended account is shown the suspension notice instead of the page.
 */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const { user, isDemoAdmin, isSuspended, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <LoadingState message="Checking your account…" />
      </div>
    );
  }

  if (!user && !isDemoAdmin) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/signin?next=${next}`} replace />;
  }

  if (isSuspended) {
    return <AccessDeniedPage reason="Your account has been suspended by an administrator." />;
  }

  return <>{children}</>;
}