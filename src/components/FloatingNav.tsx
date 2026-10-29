import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

/* ── Handcrafted Colored Icons Closely Aligned to Each Page ── */

/** Home: Sto. Niño Parish Church Sanctuary with Golden Sun Cross */
function NavHomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Golden halo cross above church */}
      <circle cx="12" cy="4" r="2.2" fill="#ffd43b" />
      <path d="M 12 1.8 L 12 6.2 M 9.8 4 L 14.2 4" stroke="#d9480f" strokeWidth="1.2" strokeLinecap="round" />
      {/* Church Roof / Pediment in Cardinal Red */}
      <path d="M 4 11 L 12 5 L 20 11 Z" fill="#e03131" stroke="#c92a2a" strokeWidth="0.8" />
      {/* Church Sanctuary Walls in Warm Liturgical Cream */}
      <rect x="5.5" y="11" width="13" height="11" rx="1" fill="#fff9db" stroke="#ffd43b" strokeWidth="0.8" />
      {/* Rose window */}
      <circle cx="12" cy="9.5" r="1.4" fill="#ffd43b" stroke="#e67700" strokeWidth="0.6" />
      {/* Arched Parish Doorway */}
      <path d="M 10 22 V 16 C 10 14.8 14 14.8 14 16 V 22 Z" fill="#741f29" />
      {/* Azure Stained Glass Windows */}
      <rect x="7" y="13" width="1.6" height="3.2" rx="0.8" fill="#339af0" />
      <rect x="15.4" y="13" width="1.6" height="3.2" rx="0.8" fill="#339af0" />
    </svg>
  );
}

/** Festival: Sinoog Feathered Dancers Headdress & Celebration Drum */
function NavFestivalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Left Emerald Feather */}
      <path d="M 6 8 C 5 2 10 3 11 9 C 9 8 7 8 6 8 Z" fill="#20c997" />
      {/* Center Golden Plume with Crimson Core */}
      <path d="M 12 1 C 9 4 10 8 12 10 C 14 8 15 4 12 1 Z" fill="#ffd43b" />
      <path d="M 12 3 C 11 5 11.5 7 12 8 C 12.5 7 13 5 12 3 Z" fill="#ff6b6b" />
      {/* Right Royal Violet Feather */}
      <path d="M 18 8 C 19 2 14 3 13 9 C 15 8 17 8 18 8 Z" fill="#9775fa" />
      {/* Golden Diadem with Gemstones */}
      <path d="M 4 11 Q 12 13 20 11 L 19 14 Q 12 16 5 14 Z" fill="#fcc419" stroke="#d9480f" strokeWidth="0.6" />
      <circle cx="8" cy="12.5" r="1" fill="#ff6b6b" />
      <circle cx="12" cy="13.5" r="1.2" fill="#339af0" />
      <circle cx="16" cy="12.5" r="1" fill="#20c997" />
      {/* Sinoog Fiesta Drum */}
      <ellipse cx="12" cy="17" rx="6" ry="1.8" fill="#ffd43b" stroke="#e67700" strokeWidth="0.8" />
      <path d="M 6 17 V 21 C 6 22 18 22 18 21 V 17 Z" fill="#e03131" />
      <path d="M 6 17 L 9 21.5 L 12 17 L 15 21.5 L 18 17" stroke="#fff9db" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

/** Sinoog Run: Athletic Sprint Sneaker with Energy Flame & Speed Trails */
function NavRunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Athletic Speed Flame */}
      <path d="M 4 7 C 2 9 3 12 5 12 C 4 10 5 9 6 8 C 7 11 9 11 10 8 C 10 11 8 13 7 14 C 9 14 11 12 11 10 C 12 12 10 15 7 16 Z" fill="#ff922b" />
      <path d="M 5 10 C 4 11 5 12 6 12 C 6 11 6.5 10.5 7 10 C 7 11 8 11.5 8 10 C 8 11.5 7 13 6 13 Z" fill="#ffd43b" />
      {/* Sprint Motion Lines */}
      <path d="M 2 17 H 7 M 1 19 H 8 M 3 21 H 10" stroke="#ffa94d" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      {/* Running Shoe Sole */}
      <path d="M 9 20 C 13 20 16 19.5 19 19.5 C 21 19.5 23 18 23 16.5 L 21.5 16 C 18 16.5 14 17 9 17 Z" fill="#ffffff" stroke="#ced4da" strokeWidth="0.6" />
      <path d="M 9 20 L 8.5 21 C 12 21.5 17 21 21 19.5 L 20 18.5 C 16 19.5 12 20 9 20 Z" fill="#339af0" />
      {/* Neon Coral Shoe Body & Teal Accent */}
      <path d="M 11 17 L 12 13 C 12 11 14 10 16 10 L 18 13 L 21.5 16 C 18 16.5 14 17 11 17 Z" fill="#ff6b6b" />
      <path d="M 14 11 L 18 15" stroke="#20c997" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15" cy="12" r="0.8" fill="#ffd43b" />
      <circle cx="16.5" cy="13.5" r="0.8" fill="#ffd43b" />
    </svg>
  );
}

/** Activities / Schedule: Liturgical Mass Calendar with Novena Star & Church Bell */
function NavActivitiesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Calendar Body */}
      <rect x="3" y="4" width="14" height="17" rx="2.5" fill="#ffffff" stroke="#dee2e6" strokeWidth="0.8" />
      {/* Cardinal Red Liturgical Banner */}
      <path d="M 3 6.5 C 3 5.1 4.1 4 5.5 4 H 14.5 C 15.9 4 17 5.1 17 6.5 V 8.5 H 3 V 6.5 Z" fill="#e03131" />
      {/* Gold Ring Bindings */}
      <rect x="6" y="2.5" width="1.5" height="3" rx="0.75" fill="#fcc419" />
      <rect x="12.5" y="2.5" width="1.5" height="3" rx="0.75" fill="#fcc419" />
      {/* Calendar Grid Dots */}
      <circle cx="6.5" cy="11.5" r="1" fill="#adb5bd" />
      <circle cx="10" cy="11.5" r="1" fill="#adb5bd" />
      <circle cx="13.5" cy="11.5" r="1" fill="#adb5bd" />
      <circle cx="6.5" cy="15" r="1" fill="#adb5bd" />
      {/* Gold Novena Date Badge */}
      <rect x="8.5" y="13.5" width="6.5" height="5" rx="1.5" fill="#ffd43b" />
      <path d="M 11.75 14.2 L 12.2 15.4 H 13.4 L 12.4 16.1 L 12.8 17.3 L 11.75 16.6 L 10.7 17.3 L 11.1 16.1 L 10.1 15.4 H 11.3 Z" fill="#c92a2a" />
      {/* Golden Church Bell */}
      <path d="M 18 10 C 16 10 15 12 15 15 C 14.5 16 14 16.5 14 17.5 H 22 C 22 16.5 21.5 16 21 15 C 21 12 20 10 18 10 Z" fill="#fcc419" stroke="#e67700" strokeWidth="0.8" />
      <circle cx="18" cy="18.5" r="1" fill="#e67700" />
      <path d="M 18 8 V 10" stroke="#fcc419" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** News: Parish Newsletter Bulletin with Blue Headline & Announcement Megaphone */
function NavNewsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Newspaper Card */}
      <rect x="2" y="4" width="15" height="17" rx="2" fill="#ffffff" stroke="#dee2e6" strokeWidth="0.8" />
      {/* Royal Blue Headline Banner */}
      <rect x="4" y="6" width="11" height="3" rx="0.8" fill="#1c7ed6" />
      {/* News Photo Thumbnail */}
      <rect x="4" y="11" width="4.5" height="4" rx="0.6" fill="#ff8787" />
      {/* Story Lines */}
      <rect x="10" y="11" width="5" height="1" rx="0.5" fill="#868e96" />
      <rect x="10" y="13" width="5" height="1" rx="0.5" fill="#adb5bd" />
      <rect x="4" y="16.5" width="11" height="1" rx="0.5" fill="#868e96" />
      <rect x="4" y="18.5" width="8" height="1" rx="0.5" fill="#adb5bd" />
      {/* Golden Megaphone Speaker */}
      <path d="M 15 12 L 20 9.5 V 17.5 L 15 15 Z" fill="#ffd43b" stroke="#f59f00" strokeWidth="0.8" />
      <rect x="13" y="12" width="2.5" height="3" rx="0.8" fill="#ff6b6b" />
      <path d="M 14 15 L 13 18" stroke="#ff6b6b" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 21.5 11.5 C 22.5 12.5 22.5 14.5 21.5 15.5" stroke="#ff922b" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** About: Liturgical Parish Scroll & Heritage Medallion */
function NavAboutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Liturgical Heritage Scroll / Book */}
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#fff9db" stroke="#ffd43b" strokeWidth="0.8" />
      {/* Cardinal Spine Ribbon */}
      <path d="M 4 3 C 3 3 2 4 2 6 V 18 C 2 20 3 21 4 21 Z" fill="#c92a2a" />
      {/* Chi-Rho / Cross Badge */}
      <circle cx="12" cy="9.5" r="3.5" fill="#e03131" stroke="#fcc419" strokeWidth="0.6" />
      <path d="M 12 7.2 V 11.8 M 9.8 9.5 H 14.2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      {/* Document Information Lines */}
      <rect x="7" y="15" width="10" height="1.2" rx="0.6" fill="#868e96" />
      <rect x="7" y="17.2" width="6.5" height="1.2" rx="0.6" fill="#adb5bd" />
    </svg>
  );
}

/** Register: Sinoog Fun Run Race Bib & Victory Star Badge */
function NavRegisterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Race Bib Card */}
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#ffffff" stroke="#ced4da" strokeWidth="0.8" />
      {/* Emerald Runner Header Strip */}
      <path d="M 3 6 C 3 4.9 3.9 4 5 4 H 19 C 20.1 4 21 4.9 21 6 V 8.5 H 3 V 6 Z" fill="#20c997" />
      {/* Bib Corner Pin Holes */}
      <circle cx="5.5" cy="6.2" r="0.9" fill="#ffffff" />
      <circle cx="18.5" cy="6.2" r="0.9" fill="#ffffff" />
      <circle cx="5.5" cy="17.5" r="0.8" fill="#ced4da" />
      <circle cx="18.5" cy="17.5" r="0.8" fill="#ced4da" />
      {/* Gold Number Plate */}
      <rect x="6.5" y="11" width="11" height="6" rx="1.2" fill="#ffd43b" stroke="#f59f00" strokeWidth="0.6" />
      {/* Runner Checkmark / Athletic Sprint Symbol */}
      <path d="M 8.5 14 L 10.5 15.5 L 15.5 12.2" stroke="#d9480f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Gallery: Royal Indigo Camera with Rainbow Lens & Celebration Photo */
function NavGalleryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Celebration Photo Print */}
      <rect x="9" y="2" width="12" height="11" rx="1.5" transform="rotate(12 15 7.5)" fill="#ffffff" stroke="#ced4da" strokeWidth="0.8" />
      <rect x="10.5" y="3.5" width="9" height="6.5" rx="0.8" transform="rotate(12 15 7.5)" fill="#20c997" />
      <circle cx="16.5" cy="5.5" r="1.2" fill="#ffd43b" />
      {/* Indigo Camera Body */}
      <rect x="2" y="8" width="17" height="13" rx="2.5" fill="#5c7cfa" stroke="#4263eb" strokeWidth="0.8" />
      {/* Gold Flash & Red Record Lamp */}
      <rect x="5" y="6" width="4.5" height="2" rx="0.8" fill="#ffd43b" />
      <circle cx="16" cy="11" r="1" fill="#ff6b6b" />
      {/* Cyan/Amber Concentric Lens */}
      <circle cx="10.5" cy="14.5" r="4.5" fill="#1864ab" stroke="#ffd43b" strokeWidth="1" />
      <circle cx="10.5" cy="14.5" r="2.8" fill="#22b8cf" />
      <circle cx="9.5" cy="13.5" r="1" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

/** Sponsors: Golden Handshake with Ruby Heart & Gratitude Wreath */
function NavSponsorsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Radiant Heart */}
      <path d="M 12 7.5 C 10.5 4.5 6.5 5 6.5 8 C 6.5 11 12 14 12 14 C 12 14 17.5 11 17.5 8 C 17.5 5 13.5 4.5 12 7.5 Z" fill="#ff6b6b" stroke="#e03131" strokeWidth="0.8" />
      <path d="M 9.5 6.5 C 8.5 6.5 7.5 7.2 7.5 8.2" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
      {/* Clasped Hands in Gold and Warm Amber */}
      <path d="M 2 15 L 7 13 L 11 16 L 9 18 L 4 19 Z" fill="#fcc419" stroke="#e67700" strokeWidth="0.6" />
      <path d="M 22 15 L 17 13 L 12 16.5 L 14 18.5 L 20 19 Z" fill="#ff922b" stroke="#d9480f" strokeWidth="0.6" />
      <path d="M 10 15 L 12.5 17.5 M 11.5 14 L 14 16.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
      {/* Green Gratitude Laurel Arcs */}
      <path d="M 3 10 C 3 6 6 3 9 2" stroke="#20c997" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 2.5" />
      <path d="M 21 10 C 21 6 18 3 15 2" stroke="#20c997" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 2.5" />
    </svg>
  );
}

/** Account / Sign-In: Identity Shield & Golden Star / Key */
function NavAccountIcon({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Heraldic User Shield in Sapphire Blue */}
        <path d="M 12 2 L 20 5 V 12 C 20 17 16.5 20.5 12 22 C 7.5 20.5 4 17 4 12 V 5 Z" fill="#1c7ed6" stroke="#ffd43b" strokeWidth="1" />
        <circle cx="12" cy="10" r="3" fill="#ffd43b" stroke="#f59f00" strokeWidth="0.6" />
        <path d="M 7.5 18 C 7.5 15 9.5 14 12 14 C 14.5 14 16.5 15 16.5 18 Z" fill="#ffffff" />
        {/* Online Status Dot */}
        <circle cx="18" cy="6" r="2" fill="#51cf66" stroke="#ffffff" strokeWidth="0.8" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Golden Portal Key & Entrance Arrow */}
      <circle cx="9" cy="9" r="5" fill="#ffd43b" stroke="#e67700" strokeWidth="1" />
      <circle cx="9" cy="9" r="2.2" fill="#741f29" />
      <path d="M 13 11 L 21 19 M 18 16 L 20 18 M 16 18 L 18 20" stroke="#fcc419" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 19 8 L 22 11 L 19 14 M 22 11 H 15" stroke="#20c997" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Workspace / Admin: Multi-colored Operations Command Grid */
function NavWorkspaceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="#ff6b6b" stroke="#e03131" strokeWidth="0.8" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="#ffd43b" stroke="#f59f00" strokeWidth="0.8" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="#339af0" stroke="#1c7ed6" strokeWidth="0.8" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="#20c997" stroke="#0ca678" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="2.2" fill="#ffffff" stroke="#f59f00" strokeWidth="1" />
    </svg>
  );
}

interface NavItemDef {
  label: string;
  path: string;
  renderIcon: () => ReactNode;
  exact?: boolean;
}

export function FloatingNav() {
  const { user, isDemoAdmin, isAdmin } = useAuth();
  const signedIn = Boolean(user) || isDemoAdmin;
  const location = useLocation();
  const listRef = useRef<HTMLUListElement | null>(null);

  const navItems: NavItemDef[] = useMemo(
    () => [
      // Page 1 (First 5 exact menus)
      { label: 'Home', path: '/', renderIcon: () => <NavHomeIcon />, exact: true },
      { label: 'Festival', path: '/festival', renderIcon: () => <NavFestivalIcon /> },
      { label: 'Run', path: '/run', renderIcon: () => <NavRunIcon />, exact: true },
      { label: 'Schedule', path: '/activities', renderIcon: () => <NavActivitiesIcon /> },
      { label: 'News', path: '/news', renderIcon: () => <NavNewsIcon /> },

      // Page 2 (Next 5 exact menus)
      { label: 'Gallery', path: '/gallery', renderIcon: () => <NavGalleryIcon /> },
      { label: 'Sponsors', path: '/sponsors', renderIcon: () => <NavSponsorsIcon /> },
      { label: 'About', path: '/about', renderIcon: () => <NavAboutIcon />, exact: true },
      ...(signedIn
        ? isAdmin || isDemoAdmin
          ? [
              {
                label: 'Account',
                path: '/account',
                renderIcon: () => <NavAccountIcon signedIn={true} />,
              },
              {
                label: 'Workspace',
                path: '/admin',
                renderIcon: () => <NavWorkspaceIcon />,
              },
            ]
          : [
              {
                label: 'Register',
                path: '/run/register',
                renderIcon: () => <NavRegisterIcon />,
                exact: true,
              },
              {
                label: 'Account',
                path: '/account',
                renderIcon: () => <NavAccountIcon signedIn={true} />,
              },
            ]
        : [
            {
              label: 'Register',
              path: '/run/register',
              renderIcon: () => <NavRegisterIcon />,
              exact: true,
            },
            {
              label: 'Sign in',
              path: '/signin',
              renderIcon: () => <NavAccountIcon signedIn={false} />,
            },
          ]),
    ],
    [signedIn, isAdmin, isDemoAdmin],
  );

  // Derive target page for active route
  const activeRouteIndex = useMemo(() => {
    return navItems.findIndex((item) => {
      if (item.exact) return location.pathname === item.path;
      if (item.path === '/run') {
        return location.pathname === '/run' || location.pathname === '/run/routes';
      }
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    });
  }, [location.pathname, navItems]);

  const activeRoutePage = activeRouteIndex >= 5 ? 1 : 0;
  const [swipedPage, setSwipedPage] = useState<number | null>(null);
  const [lastPathname, setLastPathname] = useState(location.pathname);

  // Reset swiped page when route changes so active item's page is displayed
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setSwipedPage(null);
  }

  const currentPage = swipedPage ?? activeRoutePage;

  // Align scroll offset with current page smoothly
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const rafId = requestAnimationFrame(() => {
      if (list.clientWidth > 0) {
        list.scrollTo({
          left: currentPage * list.clientWidth,
          behavior: 'smooth',
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [currentPage]);

  // Track user swipe / horizontal scroll position between the two 5-item pages
  const handleScroll = () => {
    const list = listRef.current;
    if (!list || list.clientWidth === 0) return;
    const pageIndex = Math.round(list.scrollLeft / list.clientWidth);
    if ((pageIndex === 0 || pageIndex === 1) && pageIndex !== currentPage) {
      setSwipedPage(pageIndex);
    }
  };

  const goToPage = (pageIndex: number) => {
    const list = listRef.current;
    if (!list) return;
    setSwipedPage(pageIndex);
    list.scrollTo({
      left: pageIndex * list.clientWidth,
      behavior: 'smooth',
    });
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="pub-floating-nav"
    >
      <div className="pub-floating-nav__pill">
        <ul
          ref={listRef}
          className="pub-floating-nav__list"
          onScroll={handleScroll}
        >
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : item.path === '/run'
                ? location.pathname === '/run' || location.pathname === '/run/routes'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <li key={item.path} className="pub-floating-nav__item">
                <NavLink
                  to={item.path}
                  end={item.exact}
                  data-active={isActive ? 'true' : undefined}
                  className={({ isActive: active }) =>
                    `pub-floating-nav__link${active ? ' is-active' : ''}`
                  }
                  aria-label={item.label}
                >
                  <span className="pub-floating-nav__icon-wrap">
                    {item.renderIcon()}
                  </span>
                  <span className="pub-floating-nav__label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* 2-page pagination indicator for quick tap and visual feedback */}
        <div className="pub-floating-nav__pagination" role="tablist" aria-label="Menu pages">
          <button
            type="button"
            role="tab"
            aria-selected={currentPage === 0}
            aria-label="Page 1: Home, Festival, Run, Schedule, News"
            className={`pub-floating-nav__dot${currentPage === 0 ? ' is-active' : ''}`}
            onClick={() => goToPage(0)}
          />
          <button
            type="button"
            role="tab"
            aria-selected={currentPage === 1}
            aria-label="Page 2: Gallery, Sponsors, About, Register, Account"
            className={`pub-floating-nav__dot${currentPage === 1 ? ' is-active' : ''}`}
            onClick={() => goToPage(1)}
          />
        </div>
      </div>
    </nav>
  );
}
