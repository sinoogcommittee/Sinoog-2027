import { useMemo, type ReactNode } from 'react';
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

export interface PortalNavItem {
  label: string;
  path: string;
  Icon: () => ReactNode;
  permission: AdminPermission;
  exact?: boolean;
}

export interface PortalNavSection {
  category: string;
  items: readonly PortalNavItem[];
}

const NAV_SECTIONS: readonly PortalNavSection[] = [
  {
    category: 'Core Operations',
    items: [
      { label: 'Overview', path: '/admin', Icon: AdminOverviewIcon, permission: 'overview', exact: true },
    ],
  },
  {
    category: 'Run Operations',
    items: [
      { label: 'Registrations', path: '/admin/registrations', Icon: AdminRegistrationsIcon, permission: 'registrations' },
      { label: 'Kit Claiming', path: '/admin/kit-claims', Icon: AdminKitClaimIcon, permission: 'kit_claims' },
      { label: 'Race Timing', path: '/admin/run-timing', Icon: AdminTimingIcon, permission: 'run_timing' },
    ],
  },
  {
    category: 'Festival & Liturgy',
    items: [
      { label: 'Activities & Schedule', path: '/admin/activities', Icon: AdminActivitiesIcon, permission: 'activities' },
      { label: 'Delegations', path: '/admin/delegations', Icon: AdminDelegationsIcon, permission: 'delegations' },
    ],
  },
  {
    category: 'Communications & Media',
    items: [
      { label: 'News Posts', path: '/admin/posts', Icon: AdminNewsIcon, permission: 'posts' },
      { label: 'Sponsors', path: '/admin/sponsors', Icon: AdminSponsorsIcon, permission: 'sponsors' },
      { label: 'Media Gallery', path: '/admin/gallery', Icon: AdminGalleryIcon, permission: 'gallery' },
    ],
  },
  {
    category: 'Governance & System',
    items: [
      { label: 'Users & Staff', path: '/admin/users', Icon: AdminUsersIcon, permission: 'users' },
      { label: 'Financial Records', path: '/admin/finance', Icon: AdminFinanceIcon, permission: 'finance' },
      { label: 'Audit History', path: '/admin/audit', Icon: AdminAuditIcon, permission: 'audit' },
      { label: 'Website Settings', path: '/admin/settings', Icon: AdminSettingsIcon, permission: 'settings' },
    ],
  },
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

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccess(item.permission)),
    })).filter((section) => section.items.length > 0);
  }, [canAccess]);

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
            {visibleSections.map((section) => (
              <div key={section.category} className="portal-nav-section">
                <div className="portal-nav-category-header">
                  <span>{section.category}</span>
                </div>
                <div className="portal-nav-section-items">
                  {section.items.map((item) => (
                    <NavLink
                      className="portal-nav-item"
                      key={item.path}
                      to={item.path}
                      end={item.exact}
                      title={item.label}
                    >
                      <span className="portal-nav-icon">
                        <item.Icon />
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
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
