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
} from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../features/auth/useAuth';

const items = [
  ['Overview', '/admin', Home],
  ['Activities & Schedule', '/admin/activities', Calendar],
  ['News posts', '/admin/posts', Newspaper],
  ['Registrations', '/admin/registrations', ClipboardCheck],
  ['Race timing', '/admin/run-timing', Flag],
  ['Delegations', '/admin/delegations', ShieldCheck],
  ['Users & Staff', '/admin/users', UserCog],
  ['Website settings', '/admin/settings', Settings],
] as const;

export function PortalLayout() {
  const navigate = useNavigate();
  const { user, profile, isDemoAdmin, isAdmin, signOut } = useAuth();

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : isDemoAdmin ? 'Demo Administrator' : 'Administrator');
  const displayEmail = user?.email || (isDemoAdmin ? 'local-preview@sinoog2027.internal' : 'Administrator account');

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
            {items.map(([label, path, Icon]) => (
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
            <span>{displayName} {isAdmin ? '(Admin)' : ''}</span>
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
