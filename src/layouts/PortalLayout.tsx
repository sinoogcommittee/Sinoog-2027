import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../features/auth/useAuth';
import { AdminFloatingNav } from '../components/AdminFloatingNav';
import {
  AdminOverviewIcon,
  AdminActivitiesIcon,
  AdminNewsIcon,
  AdminRegistrationsIcon,
  AdminKitClaimIcon,
  AdminTimingIcon,
  AdminDelegationsIcon,
  AdminUsersIcon,
  AdminFinanceIcon,
  AdminSponsorsIcon,
  AdminGalleryIcon,
  AdminAuditIcon,
  AdminSettingsIcon,
  AdminPublicSiteIcon,
  AdminSignOutIcon,
} from '../components/AdminNavIcons';

import type { AdminPermission } from '../features/auth/authState';

const items = [
  ['Overview', '/admin', AdminOverviewIcon, 'overview'],
  ['Activities & Schedule', '/admin/activities', AdminActivitiesIcon, 'activities'],
  ['News posts', '/admin/posts', AdminNewsIcon, 'posts'],
  ['Registrations', '/admin/registrations', AdminRegistrationsIcon, 'registrations'],
  ['Kit claiming', '/admin/kit-claims', AdminKitClaimIcon, 'kit_claims'],
  ['Race timing', '/admin/run-timing', AdminTimingIcon, 'run_timing'],
  ['Delegations', '/admin/delegations', AdminDelegationsIcon, 'delegations'],
  ['Users & Staff', '/admin/users', AdminUsersIcon, 'users'],
  ['Financial records', '/admin/finance', AdminFinanceIcon, 'finance'],
  ['Sponsors', '/admin/sponsors', AdminSponsorsIcon, 'sponsors'],
  ['Gallery', '/admin/gallery', AdminGalleryIcon, 'gallery'],
  ['Audit history', '/admin/audit', AdminAuditIcon, 'audit'],
  ['Website settings', '/admin/settings', AdminSettingsIcon, 'settings'],
] as const;

export function PortalLayout() {
  const navigate = useNavigate();
  const { user, profile, isDemoAdmin, isSuperAdmin, isAdmin, roles, canAccess, signOut } = useAuth();

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : isDemoAdmin ? 'Demo Administrator' : 'Administrator');
  const displayEmail = user?.email || (isDemoAdmin ? 'local-preview@sinoog2027.internal' : 'Administrator account');
  const staffRoleCount = roles.filter((r) => r !== 'public_user').length;
  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : isAdmin
      ? 'Admin'
      : staffRoleCount > 0
        ? `${staffRoleCount} assigned role${staffRoleCount > 1 ? 's' : ''}`
        : 'Committee Staff';
  const visibleItems = items.filter(([, , , permission]) => canAccess(permission as AdminPermission));

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="m3-portal portal">
      <aside className="portal-sidebar">
        <Link className="brand brand--light" to="/">
          <LogoMark type="committee" />
          <span>
            <strong className="portal-brand-title" style={{ whiteSpace: 'nowrap' }}>Sinoog Festival</strong>
            <small className="portal-brand-sub" style={{ whiteSpace: 'nowrap' }}>Committee workspace</small>
          </span>
        </Link>
        <div className="portal-nav-scroll">
          <nav aria-label="Committee workspace navigation">
            {visibleItems.map(([label, path, Icon]) => (
              <NavLink
                className="portal-nav-item"
                key={path}
                to={path}
                end={path === '/admin'}
                title={label}
              >
                <span className="portal-nav-icon">
                  <Icon />
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="portal-sidebar-actions">
            <Link className="portal-public-site" to="/account" title="View my runner account and digital pass">
              <span className="portal-nav-icon">
                <AdminRegistrationsIcon />
              </span>
              <span>My Runner Pass</span>
            </Link>
            <Link className="portal-public-site" to="/" title="View public website">
              <span className="portal-nav-icon">
                <AdminPublicSiteIcon />
              </span>
              <span>Public site</span>
            </Link>
            <button type="button" className="portal-exit" onClick={() => void handleSignOut()} title="Sign out">
              <span className="portal-nav-icon">
                <AdminSignOutIcon />
              </span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="portal-content">
        <header className="portal-topbar">
          <Link className="portal-topbar-brand brand brand--light" to="/" title="Sinoog Festival home">
            <LogoMark type="committee" />
            <span>
              <strong className="portal-brand-title" style={{ whiteSpace: 'nowrap' }}>Sinoog Festival</strong>
              <small className="portal-brand-sub" style={{ whiteSpace: 'nowrap' }}>Committee workspace</small>
            </span>
          </Link>
          <div className="portal-topbar-user" title={`${displayName} (${roleLabel}) · ${displayEmail}`}>
            <span className="portal-topbar-user-name">{displayName}</span>
            <small className="portal-topbar-user-role">{roleLabel}</small>
            <small className="portal-topbar-user-email">{displayEmail}</small>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>

      {/* Floating Bottom Navigation for Mobile & Tablet Admin */}
      <AdminFloatingNav />
    </div>
  );
}
