import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, Home, LogOut, Newspaper, Settings, ShieldCheck, Users } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../features/auth/useAuth';

const items = [
  ['Overview', '/admin', Home],
  ['Activities & Schedule', '/admin/activities', Calendar],
  ['News posts', '/admin/posts', Newspaper],
  ['Registrations', '/admin/registrations', Users],
  ['Delegations', '/admin/delegations', ShieldCheck],
  ['Users & Staff', '/admin/users', Users],
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
        <nav>
          {items.map(([label, path, Icon]) => (
            <NavLink key={path} to={path} end={path === '/admin'}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="portal-exit" onClick={() => void handleSignOut()}>
          <LogOut size={18} /> Sign out
        </button>
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
