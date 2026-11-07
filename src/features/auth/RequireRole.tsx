import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { AccessDeniedPage } from './AccessDeniedPage';
import { LoadingState } from '../ui/FeedbackStates';
import type { AdminPermission } from './authState';
import type { AppRole } from '../../types';

type RequiredRole =
  | 'admin'
  | 'super_admin'
  | 'staff'
  | 'news_in_charge'
  | 'delegation_head'
  | 'public_user'
  | AppRole;

interface RequireRoleProps {
  role?: RequiredRole;
  permission?: AdminPermission;
}

export function RequireRole({ role = 'admin', permission }: RequireRoleProps) {
  const {
    user,
    isDemoAdmin,
    isSuperAdmin,
    isAdmin,
    isStaff,
    canAccess,
    hasRole,
    loading,
    isSuspended,
  } = useAuth();
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

  let hasAccess = false;
  if (permission) {
    hasAccess = canAccess(permission);
  } else if (role === 'staff') {
    hasAccess = isStaff;
  } else if (role === 'public_user') {
    hasAccess = Boolean(user || isDemoAdmin);
  } else if (role === 'super_admin') {
    hasAccess = isSuperAdmin;
  } else if (role === 'admin') {
    hasAccess = isAdmin;
  } else {
    hasAccess = hasRole(role as AppRole);
  }

  if (!user && !isDemoAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return (
      <AccessDeniedPage
        requiredRole={role}
        reason={
          permission
            ? `You do not have the required "${permission}" committee permission. Contact a Super Administrator or Admin to assign this role to your account.`
            : role === 'staff'
              ? 'A committee staff role is required to open this workspace.'
              : undefined
        }
      />
    );
  }

  return <Outlet />;
}

export function RequireAdmin() {
  return <RequireRole role="admin" />;
}

export function RequireSuperAdmin() {
  return <RequireRole role="super_admin" />;
}

export function RequirePermission({ permission }: { permission: AdminPermission }) {
  return <RequireRole permission={permission} />;
}
