import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ClipboardCheck,
  ExternalLink,
  Flag,
  Home,
  LogOut,
  Newspaper,
  Settings,
  ShieldCheck,
  UserCog,
  CircleDollarSign,
} from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../features/auth/useAuth';

const items = [
  ['Overview', '/admin', Home, 'admin'],
  ['Activities & Schedule', '/admin/activities', Calendar, 'admin'],
  ['News posts', '/admin/posts', Newspaper, 'news'],
  ['Registrations', '/admin/registrations', ClipboardCheck, 'admin'],
  ['Race timing', '/admin/run-timing', Flag, 'admin'],
  ['Delegations', '/admin/delegations', ShieldCheck, 'delegation'],
  ['Users & Staff', '/admin/users', UserCog, 'admin'],
  ['Financial records', '/admin/finance', CircleDollarSign, 'admin'],
  ['Website settings', '/admin/settings', Settings, 'admin'],
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
    <div className="portal">
      <aside className="portal-sidebar">
        <Link className="brand brand--light" to="/">
          <LogoMark type="committee" />
          <span>
            <strong>Sinoog 2027</strong>
            <small>Committee workspace</small>
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
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="portal-sidebar-actions">
            <Link className="portal-public-site" to="/" title="View public website">
              <ExternalLink size={19} aria-hidden="true" />
              <span>Public site</span>
            </Link>
            <button type="button" className="portal-exit" onClick={() => void handleSignOut()} title="Sign out">
              <LogOut size={19} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="portal-content">
        <header className="portal-topbar">
          <div>
            <span>{displayName} ({roleLabel})</span>
            <small>{displayEmail}</small>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
