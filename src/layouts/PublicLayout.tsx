/**
 * Sinoog 2027 — Public layout shell (P1-007 M3 upgrade)
 *
 * Top app bar:
 *  - Compact / medium (< 840 px): logo + hamburger.
 *  - Expanded (≥ 840 px): inline navigation links; hamburger hidden.
 *
 * Modal navigation drawer (compact / medium only):
 *  - Opens on hamburger activation.
 *  - Closes on Escape, backdrop click, or nav link click.
 *  - Route change closes the drawer via derived-state reset during render
 *    (avoids react/set-state-in-effect lint warning).
 *
 * All nav and footer content preserved from the previous version.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { FloatingNav } from '../components/FloatingNav';
import { useAuth } from '../features/auth/useAuth';

const NAV_LINKS = [
  { label: 'Festival', path: '/festival' },
  { label: 'Sinoog Run', path: '/run' },
  { label: 'Activities', path: '/activities' },
  { label: 'News', path: '/news' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Sponsors', path: '/sponsors' },
] as const;

export function PublicLayout() {
  const { user, isDemoAdmin, isAdmin } = useAuth();
  const signedIn = Boolean(user) || isDemoAdmin;
  const location = useLocation();
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  // Track which pathname the drawer was last opened/closed on.
  // When the pathname changes, we close the drawer without a useEffect.
  const [drawerPathname, setDrawerPathname] = useState(location.pathname);
  if (location.pathname !== drawerPathname) {
    setDrawerPathname(location.pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  /* Escape key closes drawer */
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  /* Prevent body scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    menuBtnRef.current?.focus();
  };

  return (
    <div className="site-shell">
      {/* Skip link */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* ── Top app bar ── */}
      <header className="pub-topbar">
        <div className="pub-topbar__inner">
          {/* Brand */}
          <Link className="pub-topbar__brand" to="/" aria-label="Sinoog 2027 — home">
            <LogoMark type="parish" />
            <span className="pub-topbar__brand-text">
              <strong>Sinoog 2027</strong>
              <small>Sto. Niño Parish · Guinacot</small>
            </span>
          </Link>

          {/* Inline nav (expanded only, ≥840 px) */}
          <nav className="pub-topbar__nav" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, path }) => (
              <NavLink key={path} to={path} className="pub-topbar__navlink">
                {label}
              </NavLink>
            ))}
            {signedIn ? (
              <>
                <NavLink to="/account" className="pub-topbar__navlink">
                  My account
                </NavLink>
                {(isAdmin || isDemoAdmin) && (
                  <NavLink to="/admin" className="pub-topbar__navlink">
                    Workspace
                  </NavLink>
                )}
              </>
            ) : (
              <Link to="/signin" className="pub-topbar__signin">
                Sign in
              </Link>
            )}
          </nav>

          {/* Hamburger (compact + medium only) */}
          <button
            ref={menuBtnRef}
            type="button"
            className="pub-topbar__menu-btn"
            aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={drawerOpen}
            aria-controls="pub-nav-drawer"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ── Modal navigation drawer (compact + medium) ── */}
      {drawerOpen && (
        <div
          className="pub-drawer-scrim"
          aria-hidden="true"
          onClick={closeDrawer}
        />
      )}
      <div
        id="pub-nav-drawer"
        className={`pub-drawer${drawerOpen ? ' pub-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!drawerOpen}
      >
        <div className="pub-drawer__header">
          <LogoMark type="parish" />
          <span className="pub-drawer__brand">Sinoog 2027</span>
          <button
            type="button"
            className="pub-drawer__close"
            aria-label="Close navigation"
            onClick={closeDrawer}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="pub-drawer__nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className="pub-drawer__link"
              tabIndex={drawerOpen ? 0 : -1}
              onClick={closeDrawer}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="pub-drawer__footer">
          {signedIn ? (
            <>
              <Link
                to="/account"
                className="pub-drawer__link"
                tabIndex={drawerOpen ? 0 : -1}
                onClick={closeDrawer}
              >
                My account
              </Link>
              {(isAdmin || isDemoAdmin) && (
                <Link
                  to="/admin"
                  className="pub-drawer__link"
                  tabIndex={drawerOpen ? 0 : -1}
                  onClick={closeDrawer}
                >
                  Committee workspace
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="pub-drawer__link pub-drawer__link--accent"
                tabIndex={drawerOpen ? 0 : -1}
                onClick={closeDrawer}
              >
                Runner sign in
              </Link>
              <Link
                to="/login"
                className="pub-drawer__link"
                tabIndex={drawerOpen ? 0 : -1}
                onClick={closeDrawer}
              >
                Staff sign in
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main id="main">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-identity">
            <div className="brand brand--light">
              <LogoMark type="parish" />
              <span>
                <strong>Sinoog 2027</strong>
                <small>Faith, culture, and community</small>
              </span>
            </div>
            <p>Official celebration website of Sto. Niño Parish — Guinacot.</p>
            <div className="footer-marks">
              <LogoMark type="committee" />
              <span>
                Organized by the
                <br />
                <strong>Sinoog Committee</strong>
              </span>
            </div>
          </div>
          <div className="footer-links">
            <h3>Explore</h3>
            <Link to="/festival">Festival</Link>
            <Link to="/run">Sinoog Run</Link>
            <Link to="/activities">Masses &amp; activities</Link>
            <Link to="/news">News</Link>
          </div>
          <div className="footer-links">
            <h3>Information</h3>
            <Link to="/about">About &amp; contact</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms &amp; waiver</Link>
            <Link to="/login">Staff sign in</Link>
            <a
              href="https://www.facebook.com/Sto.NinoParishGuinacot"
              target="_blank"
              rel="noreferrer"
            >
              Parish Facebook
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2027 Sinoog Committee</span>
        </div>
      </footer>

      {/* Floating bottom navigation bar on mobile (Division ExeCon pattern) */}
      <FloatingNav />
    </div>
  );
}
