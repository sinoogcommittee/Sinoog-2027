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

const items = [
  ['Overview', '/admin', AdminOverviewIcon, 'admin'],
  ['Activities & Schedule', '/admin/activities', AdminActivitiesIcon, 'admin'],
  ['News posts', '/admin/posts', AdminNewsIcon, 'news'],
  ['Registrations', '/admin/registrations', AdminRegistrationsIcon, 'admin'],
  ['Kit claiming', '/admin/kit-claims', AdminKitClaimIcon, 'admin'],
  ['Race timing', '/admin/run-timing', AdminTimingIcon, 'admin'],
  ['Delegations', '/admin/delegations', AdminDelegationsIcon, 'delegation'],
  ['Users & Staff', '/admin/users', AdminUsersIcon, 'admin'],
  ['Financial records', '/admin/finance', AdminFinanceIcon, 'admin'],
  ['Sponsors', '/admin/sponsors', AdminSponsorsIcon, 'admin'],
  ['Gallery', '/admin/gallery', AdminGalleryIcon, 'admin'],
  ['Audit history', '/admin/audit', AdminAuditIcon, 'admin'],
  ['Website settings', '/admin/settings', AdminSettingsIcon, 'admin'],
] as const;

export function PortalLayout() {
  const navigate = useNavigate();
  const { user, profile, isDemoAdmin, isAdmin, isNewsInCharge, isDelegationHead, signOut } = useAuth();

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : isDemoAdmin ? 'Demo Administrator' : 'Administrator');
  const displayEmail = user?.email || (isDemoAdmin ? 'local-preview@sinoog2027.internal' : 'Administrator account');
  const roleLabel = isAdmin
    ? 'Admin'
    : isNewsInCharge && isDelegationHead
      ? 'News staff · Delegation head'
      : isNewsInCharge
        ? 'News staff'
        : 'Delegation head';
  const visibleItems = items.filter(([, , , access]) =>
    isAdmin ||
    (access === 'news' && isNewsInCharge) ||
    (access === 'delegation' && isDelegationHead),
  );

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
