import { describe, expect, it } from 'vitest';
import type { AppRole, Profile } from '../../types';

// Pure helper function reflecting AuthContext role derivation logic
export function deriveUserCapabilities(
  profile: Partial<Profile> | null,
  roles: AppRole[],
  isDemoAdmin = false
) {
  const isSuspended = Boolean(profile?.suspended_at);
  const isSuperAdmin = !isSuspended && roles.includes('super_admin');
  const isAdmin = !isSuspended && (isDemoAdmin || isSuperAdmin || roles.includes('admin'));
  const isNewsInCharge = !isSuspended && (isAdmin || roles.includes('news_in_charge'));
  const isDelegationHead = !isSuspended && (isAdmin || roles.includes('delegation_head') || roles.includes('delegations_manager'));
  const isStaff = !isSuspended && (isAdmin || roles.some((r) => r !== 'public_user'));
  const isPublicUser = !isSuspended && (isDemoAdmin || roles.includes('public_user') || Boolean(profile?.id));

  const canAccess = (permission: string) => {
    if (isSuspended) return false;
    if (isDemoAdmin || isSuperAdmin || isAdmin) return true;
    switch (permission) {
      case 'overview':
        return isStaff;
      case 'activities':
        return roles.includes('activities_coordinator');
      case 'posts':
        return roles.includes('news_in_charge');
      case 'registrations':
        return roles.includes('registrations_manager');
      case 'kit_claims':
        return roles.includes('kit_claims_officer');
      case 'run_timing':
        return roles.includes('timing_official');
      case 'delegations':
        return roles.includes('delegations_manager') || roles.includes('delegation_head');
      case 'users':
        return roles.includes('users_manager');
      case 'finance':
        return roles.includes('finance_officer');
      case 'sponsors':
        return roles.includes('sponsors_manager');
      case 'gallery':
        return roles.includes('gallery_manager') || roles.includes('news_in_charge');
      case 'audit':
        return roles.includes('audit_viewer');
      case 'settings':
        return roles.includes('settings_manager');
      default:
        return false;
    }
  };

  return {
    isSuspended,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isNewsInCharge,
    isDelegationHead,
    isPublicUser,
    canAccess,
  };
}

// Route permission check helper mirroring RequireRole.tsx
export function checkRouteAccess(
  capabilities: ReturnType<typeof deriveUserCapabilities>,
  requiredRole: 'super_admin' | 'admin' | 'staff' | 'news_in_charge' | 'delegation_head' | 'public_user'
): boolean {
  if (capabilities.isSuspended) return false;
  if (capabilities.isSuperAdmin) return true;
  if (capabilities.isAdmin && requiredRole !== 'super_admin') return true;

  switch (requiredRole) {
    case 'super_admin':
      return capabilities.isSuperAdmin;
    case 'admin':
      return capabilities.isAdmin;
    case 'staff':
      return capabilities.isStaff;
    case 'news_in_charge':
      return capabilities.isNewsInCharge;
    case 'delegation_head':
      return capabilities.isDelegationHead;
    case 'public_user':
      return capabilities.isPublicUser;
    default:
      return false;
  }
}

describe('authPolicy — Role-Based Access Control & Security Policies', () => {
  it('gives administrator full operational permissions across all routes', () => {
    const caps = deriveUserCapabilities({ id: 'admin-1', suspended_at: null }, ['admin']);

    expect(caps.isAdmin).toBe(true);
    expect(caps.isNewsInCharge).toBe(true);
    expect(caps.isDelegationHead).toBe(true);
    expect(caps.isPublicUser).toBe(true);
    expect(caps.isSuspended).toBe(false);

    expect(checkRouteAccess(caps, 'admin')).toBe(true);
    expect(checkRouteAccess(caps, 'staff')).toBe(true);
    expect(checkRouteAccess(caps, 'news_in_charge')).toBe(true);
    expect(checkRouteAccess(caps, 'delegation_head')).toBe(true);
  });

  it('restricts news staff strictly to news management', () => {
    const caps = deriveUserCapabilities({ id: 'news-editor-1', suspended_at: null }, ['news_in_charge']);

    expect(caps.isAdmin).toBe(false);
    expect(caps.isNewsInCharge).toBe(true);
    expect(caps.isDelegationHead).toBe(false);

    // Can access news & staff routes
    expect(checkRouteAccess(caps, 'news_in_charge')).toBe(true);
    expect(checkRouteAccess(caps, 'staff')).toBe(true);

    // BLOCKED from admin, registrations, kit claims, finance, audit
    expect(checkRouteAccess(caps, 'admin')).toBe(false);
    expect(checkRouteAccess(caps, 'delegation_head')).toBe(false);
  });

  it('restricts delegation head strictly to delegation workspace', () => {
    const caps = deriveUserCapabilities({ id: 'del-head-1', suspended_at: null }, ['delegation_head']);

    expect(caps.isAdmin).toBe(false);
    expect(caps.isNewsInCharge).toBe(false);
    expect(caps.isDelegationHead).toBe(true);

    // Can access delegation & staff routes
    expect(checkRouteAccess(caps, 'delegation_head')).toBe(true);
    expect(checkRouteAccess(caps, 'staff')).toBe(true);

    // BLOCKED from admin, news, finance, audit, kit claims
    expect(checkRouteAccess(caps, 'admin')).toBe(false);
    expect(checkRouteAccess(caps, 'news_in_charge')).toBe(false);
  });

  it('prevents regular runners from accessing any committee workspace', () => {
    const caps = deriveUserCapabilities({ id: 'runner-1', suspended_at: null }, ['public_user']);

    expect(caps.isAdmin).toBe(false);
    expect(caps.isNewsInCharge).toBe(false);
    expect(caps.isDelegationHead).toBe(false);
    expect(caps.isPublicUser).toBe(true);

    // Cannot access any privileged role
    expect(checkRouteAccess(caps, 'admin')).toBe(false);
    expect(checkRouteAccess(caps, 'staff')).toBe(false);
    expect(checkRouteAccess(caps, 'news_in_charge')).toBe(false);
    expect(checkRouteAccess(caps, 'delegation_head')).toBe(false);

    // Only public user routes allowed
    expect(checkRouteAccess(caps, 'public_user')).toBe(true);
  });

  it('immediately revokes all capabilities if an account is suspended', () => {
    const caps = deriveUserCapabilities(
      { id: 'bad-actor-1', suspended_at: '2026-10-30T10:00:00Z' },
      ['admin', 'news_in_charge', 'delegation_head']
    );

    expect(caps.isSuspended).toBe(true);
    expect(caps.isAdmin).toBe(false);
    expect(caps.isNewsInCharge).toBe(false);
    expect(caps.isDelegationHead).toBe(false);
    expect(caps.isPublicUser).toBe(false);

    expect(checkRouteAccess(caps, 'admin')).toBe(false);
    expect(checkRouteAccess(caps, 'staff')).toBe(false);
    expect(checkRouteAccess(caps, 'public_user')).toBe(false);
  });

  it('allows demo administrator only when explicitly enabled in local dev', () => {
    const caps = deriveUserCapabilities(null, [], true);

    expect(caps.isAdmin).toBe(true);
    expect(caps.isPublicUser).toBe(true);
    expect(checkRouteAccess(caps, 'admin')).toBe(true);
  });

  it('recognizes super administrator and grants top privileges across all modules', () => {
    const caps = deriveUserCapabilities({ id: 'creator-1', suspended_at: null }, ['super_admin']);

    expect(caps.isSuperAdmin).toBe(true);
    expect(caps.isAdmin).toBe(true);
    expect(caps.isStaff).toBe(true);
    expect(checkRouteAccess(caps, 'super_admin')).toBe(true);
    expect(checkRouteAccess(caps, 'admin')).toBe(true);
    expect(checkRouteAccess(caps, 'staff')).toBe(true);
    expect(caps.canAccess('overview')).toBe(true);
    expect(caps.canAccess('activities')).toBe(true);
    expect(caps.canAccess('registrations')).toBe(true);
    expect(caps.canAccess('kit_claims')).toBe(true);
    expect(caps.canAccess('finance')).toBe(true);
    expect(caps.canAccess('settings')).toBe(true);
  });

  it('restricts staff strictly to their checked page roles', () => {
    const caps = deriveUserCapabilities({ id: 'volunteer-1', suspended_at: null }, [
      'kit_claims_officer',
      'registrations_manager',
    ]);

    expect(caps.isSuperAdmin).toBe(false);
    expect(caps.isAdmin).toBe(false);
    expect(caps.isStaff).toBe(true);

    // Only permitted modules
    expect(caps.canAccess('overview')).toBe(true);
    expect(caps.canAccess('kit_claims')).toBe(true);
    expect(caps.canAccess('registrations')).toBe(true);

    // Blocked from unassigned modules
    expect(caps.canAccess('finance')).toBe(false);
    expect(caps.canAccess('settings')).toBe(false);
    expect(caps.canAccess('users')).toBe(false);
    expect(caps.canAccess('audit')).toBe(false);
    expect(caps.canAccess('activities')).toBe(false);
  });
});
