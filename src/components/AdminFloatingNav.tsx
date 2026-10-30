import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import {
  AdminOverviewIcon,
  AdminActivitiesIcon,
  AdminNewsIcon,
  AdminRegistrationsIcon,
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
} from './AdminNavIcons';

export interface AdminNavItemDef {
  label: string;
  path: string;
  renderIcon: () => ReactNode;
  access: 'admin' | 'news' | 'delegation';
  exact?: boolean;
  isAction?: boolean;
  onAction?: () => void | Promise<void>;
}

export function AdminFloatingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isNewsInCharge, isDelegationHead, signOut } = useAuth();
  const listRef = useRef<HTMLUListElement | null>(null);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const allItems: AdminNavItemDef[] = useMemo(
    () => [
      // Page 1: Core Operations (1 - 5)
      {
        label: 'Overview',
        path: '/admin',
        renderIcon: () => <AdminOverviewIcon />,
        access: 'admin',
        exact: true,
      },
      {
        label: 'Activities',
        path: '/admin/activities',
        renderIcon: () => <AdminActivitiesIcon />,
        access: 'admin',
      },
      {
        label: 'News',
        path: '/admin/posts',
        renderIcon: () => <AdminNewsIcon />,
        access: 'news',
      },
      {
        label: 'Registrations',
        path: '/admin/registrations',
        renderIcon: () => <AdminRegistrationsIcon />,
        access: 'admin',
      },
      {
        label: 'Timing',
        path: '/admin/run-timing',
        renderIcon: () => <AdminTimingIcon />,
        access: 'admin',
      },

      // Page 2: Management & Records (6 - 10)
      {
        label: 'Delegations',
        path: '/admin/delegations',
        renderIcon: () => <AdminDelegationsIcon />,
        access: 'delegation',
      },
      {
        label: 'Users',
        path: '/admin/users',
        renderIcon: () => <AdminUsersIcon />,
        access: 'admin',
      },
      {
        label: 'Finance',
        path: '/admin/finance',
        renderIcon: () => <AdminFinanceIcon />,
        access: 'admin',
      },
      {
        label: 'Sponsors',
        path: '/admin/sponsors',
        renderIcon: () => <AdminSponsorsIcon />,
        access: 'admin',
      },
      {
        label: 'Gallery',
        path: '/admin/gallery',
        renderIcon: () => <AdminGalleryIcon />,
        access: 'admin',
      },
      {
        label: 'Audit history',
        path: '/admin/audit',
        renderIcon: () => <AdminAuditIcon />,
        access: 'admin',
      },

      // Page 3: System, External & Session (11 - 13)
      {
        label: 'Settings',
        path: '/admin/settings',
        renderIcon: () => <AdminSettingsIcon />,
        access: 'admin',
      },
      {
        label: 'Public site',
        path: '/',
        renderIcon: () => <AdminPublicSiteIcon />,
        access: 'admin',
        exact: true,
      },
      {
        label: 'Sign out',
        path: '#signout',
        renderIcon: () => <AdminSignOutIcon />,
        access: 'admin',
        isAction: true,
        onAction: () => void handleSignOut(),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const visibleItems = useMemo(() => {
    return allItems.filter(
      (item) =>
        isAdmin ||
        (item.access === 'news' && isNewsInCharge) ||
        (item.access === 'delegation' && isDelegationHead),
    );
  }, [allItems, isAdmin, isNewsInCharge, isDelegationHead]);

  // Derive target page for active route
  const activeRouteIndex = useMemo(() => {
    return visibleItems.findIndex((item) => {
      if (item.isAction) return false;
      if (item.exact) return location.pathname === item.path;
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    });
  }, [location.pathname, visibleItems]);

  const totalPages = Math.ceil(visibleItems.length / 5);
  const activeRoutePage = activeRouteIndex >= 0 ? Math.floor(activeRouteIndex / 5) : 0;
  const [swipedPage, setSwipedPage] = useState<number | null>(null);
  const [lastPathname, setLastPathname] = useState(location.pathname);

  // Reset swiped page when route changes so active item's page is displayed
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setSwipedPage(null);
  }

  const currentPage = Math.min(swipedPage ?? activeRoutePage, Math.max(0, totalPages - 1));

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

  // Track user swipe / horizontal scroll position between the 5-item pages
  const handleScroll = () => {
    const list = listRef.current;
    if (!list || list.clientWidth === 0) return;
    const pageIndex = Math.round(list.scrollLeft / list.clientWidth);
    if (pageIndex >= 0 && pageIndex < totalPages && pageIndex !== currentPage) {
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
      aria-label="Admin mobile navigation"
      className="admin-floating-nav"
    >
      <div className="admin-floating-nav__pill">
        <ul
          ref={listRef}
          className="admin-floating-nav__list"
          onScroll={handleScroll}
        >
          {visibleItems.map((item) => {
            const isActive = !item.isAction && (item.exact
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

            if (item.isAction) {
              return (
                <li key={item.path} className="admin-floating-nav__item">
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="admin-floating-nav__link admin-floating-nav__action"
                    aria-label={item.label}
                  >
                    <span className="admin-floating-nav__icon-wrap">
                      {item.renderIcon()}
                    </span>
                    <span className="admin-floating-nav__label">{item.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.path} className="admin-floating-nav__item">
                <NavLink
                  to={item.path}
                  end={item.exact}
                  data-active={isActive ? 'true' : undefined}
                  className={({ isActive: active }) =>
                    `admin-floating-nav__link${active ? ' is-active' : ''}`
                  }
                  aria-label={item.label}
                >
                  <span className="admin-floating-nav__icon-wrap">
                    {item.renderIcon()}
                  </span>
                  <span className="admin-floating-nav__label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Dynamic pagination indicators when more than 1 page exists */}
        {totalPages > 1 && (
          <div className="admin-floating-nav__pagination" role="tablist" aria-label="Menu pages">
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={currentPage === idx}
                aria-label={`Page ${idx + 1}`}
                className={`admin-floating-nav__dot${currentPage === idx ? ' is-active' : ''}`}
                onClick={() => goToPage(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
