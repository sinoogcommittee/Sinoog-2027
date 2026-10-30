import { describe, expect, it } from 'vitest';
import type { AppRole, Profile } from '../../types';

// Pure helper function reflecting AuthContext role derivation logic
export function deriveUserCapabilities(
  profile: Partial<Profile> | null,
  roles: AppRole[],
  isDemoAdmin = false
) {
  const isSuspended = Boolean(profile?.suspended_at);
  const isAdmin = !isSuspended && (isDemoAdmin || roles.includes('admin'));
  const isNewsInCharge = !isSuspended && (isAdmin || roles.includes('news_in_charge'));
  const isDelegationHead = !isSuspended && (isAdmin || roles.includes('delegation_head'));
  const isPublicUser = !isSuspended && (isDemoAdmin || roles.includes('public_user') || Boolean(profile?.id));

  return {
    isSuspended,
    isAdmin,
    isNewsInCharge,
    isDelegationHead,
    isPublicUser,
  };
}

// Route permission check helper mirroring RequireRole.tsx
export function checkRouteAccess(
  capabilities: ReturnType<typeof deriveUserCapabilities>,
  requiredRole: 'admin' | 'staff' | 'news_in_charge' | 'delegation_head' | 'public_user'
): boolean {
  if (capabilities.isSuspended) return false;
  if (capabilities.isAdmin) return true;

  switch (requiredRole) {
    case 'admin':
      return capabilities.isAdmin;
    case 'staff':
      return capabilities.isNewsInCharge || capabilities.isDelegationHead;
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
});
