import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, Facebook, MapPin, Menu, X } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
const nav = [['Festival', '/festival'], ['Sinoog Run', '/run'], ['Activities', '/activities'], ['News', '/news'], ['Gallery', '/gallery'], ['Sponsors', '/sponsors']];
export function PublicLayout() {
  const [open, setOpen] = useState(false);
  return <div className="site-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="utility-bar"><div className="container utility-bar__inner"><span><MapPin size={14}/> Guinacot, Guindulman, Bohol</span><span><CalendarDays size={14}/> January 9–15, 2027</span></div></div>
      <div className="container nav-wrap">
        <Link className="brand" to="/" onClick={() => setOpen(false)}><LogoMark type="parish"/><span><strong>Sinoog 2027</strong><small>Sto. Niño Parish · Guinacot</small></span></Link>
        <button className="menu-button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
        <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">{nav.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}>{label}</NavLink>)}<Link to="/login" className="nav-login" onClick={() => setOpen(false)}>Staff login</Link></nav>
      </div>
    </header>
    <main id="main"><Outlet/></main>
    <footer className="site-footer"><div className="container footer-grid">
      <div><div className="brand brand--light"><LogoMark type="parish"/><span><strong>Sinoog 2027</strong><small>Faith, culture, and community</small></span></div><p>Official celebration website of Sto. Niño Parish — Guinacot.</p><div className="footer-marks"><LogoMark type="committee"/><span>Organized by the<br/><strong>Sinoog Committee</strong></span></div></div>
      <div><h3>Explore</h3><Link to="/festival">Festival</Link><Link to="/run">Sinoog Run</Link><Link to="/activities">Masses & activities</Link><Link to="/news">News</Link></div>
      <div><h3>Information</h3><Link to="/about">About & contact</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms & waiver</Link><a href="https://www.facebook.com/Sto.NinoParishGuinacot" target="_blank" rel="noreferrer"><Facebook size={16}/> Parish Facebook</a></div>
    </div><div className="container footer-bottom"><span>© 2027 Sinoog Committee</span><span>Times shown in Philippine Standard Time</span></div></footer>
  </div>;
}
