import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, Home, LogOut, Newspaper, Settings, ShieldCheck, Users } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { supabase } from '../lib/supabase';
const items = [['Overview', '/admin', Home], ['Registrations', '/admin/registrations', Users], ['Delegations', '/admin/delegations', ShieldCheck], ['News posts', '/admin/posts', Newspaper], ['Activities', '/admin/activities', Calendar], ['Users', '/admin/users', Users], ['Settings', '/admin/settings', Settings]] as const;
export function PortalLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('Administrator account');
  useEffect(() => { void supabase?.auth.getUser().then(({ data }) => { if (data.user?.email) setEmail(data.user.email); }); }, []);
  async function signOut() { sessionStorage.removeItem('sinoog-demo-admin'); await supabase?.auth.signOut(); navigate('/'); }
  return <div className="portal"><aside className="portal-sidebar"><Link className="brand brand--light" to="/"><LogoMark type="committee"/><span><strong>Sinoog 2027</strong><small>Committee workspace</small></span></Link><nav>{items.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === '/admin'}><Icon size={18}/>{label}</NavLink>)}</nav><button className="portal-exit" onClick={signOut}><LogOut size={18}/> Sign out</button></aside><div className="portal-content"><header className="portal-topbar"><div><span>Administrator</span><small>{email}</small></div></header><main><Outlet/></main></div></div>;
}
