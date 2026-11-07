import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import type { AdminPermission } from '../features/auth/authState';
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
  permission?: AdminPermission;
  alwaysVisible?: boolean;
  exact?: boolean;
  isAction?: boolean;
  onAction?: () => void | Promise<void>;
}

export function AdminFloatingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccess, signOut } = useAuth();
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
        permission: 'overview',
        exact: true,
      },
      {
        label: 'Activities',
        path: '/admin/activities',
        renderIcon: () => <AdminActivitiesIcon />,
        permission: 'activities',
      },
      {
        label: 'News',
        path: '/admin/posts',
        renderIcon: () => <AdminNewsIcon />,
        permission: 'posts',
      },
      {
        label: 'Registrations',
        path: '/admin/registrations',
        renderIcon: () => <AdminRegistrationsIcon />,
        permission: 'registrations',
      },
      {
        label: 'Timing',
        path: '/admin/run-timing',
        renderIcon: () => <AdminTimingIcon />,
        permission: 'run_timing',
      },

      // Page 2: Management & Records (6 - 10)
      {
        label: 'Delegations',
        path: '/admin/delegations',
        renderIcon: () => <AdminDelegationsIcon />,
        permission: 'delegations',
      },
      {
        label: 'Users',
        path: '/admin/users',
        renderIcon: () => <AdminUsersIcon />,
        permission: 'users',
      },
      {
        label: 'Finance',
        path: '/admin/finance',
        renderIcon: () => <AdminFinanceIcon />,
        permission: 'finance',
      },
      {
        label: 'Sponsors',
        path: '/admin/sponsors',
        renderIcon: () => <AdminSponsorsIcon />,
        permission: 'sponsors',
      },
      {
        label: 'Gallery',
        path: '/admin/gallery',
        renderIcon: () => <AdminGalleryIcon />,
        permission: 'gallery',
      },
      {
        label: 'Audit history',
        path: '/admin/audit',
        renderIcon: () => <AdminAuditIcon />,
        permission: 'audit',
      },

      // Page 3: System, External & Session (11 - 13)
      {
        label: 'Settings',
        path: '/admin/settings',
        renderIcon: () => <AdminSettingsIcon />,
        permission: 'settings',
      },
      {
        label: 'Public site',
        path: '/',
        renderIcon: () => <AdminPublicSiteIcon />,
        alwaysVisible: true,
        exact: true,
      },
      {
        label: 'Sign out',
        path: '#signout',
        renderIcon: () => <AdminSignOutIcon />,
        alwaysVisible: true,
        isAction: true,
        onAction: () => void handleSignOut(),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const visibleItems = useMemo(() => {
    return allItems.filter(
      (item) => item.alwaysVisible || (item.permission && canAccess(item.permission)),
    );
  }, [allItems, canAccess]);

  const [scrollProgress, setScrollProgress] = useState(0);

  // Auto-center active route's nav item on mount or when route changes
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const rafId = requestAnimationFrame(() => {
      const activeEl = list.querySelector<HTMLElement>('[data-active="true"]')?.closest<HTMLLIElement>('li');
      if (activeEl) {
        const targetScroll = activeEl.offsetLeft - (list.clientWidth / 2) + (activeEl.clientWidth / 2);
        list.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [location.pathname, visibleItems]);

  // Track fluid horizontal scroll position for the sleek scroll track
  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const maxScroll = list.scrollWidth - list.clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, list.scrollLeft / maxScroll)));
    } else {
      setScrollProgress(0);
    }
  };

  // Mouse drag support for desktop preview / testing
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const list = listRef.current;
    if (!list) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - list.offsetLeft;
    startScrollLeftRef.current = list.scrollLeft;
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const list = listRef.current;
    if (!list) return;
    const x = e.pageX - list.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    list.scrollLeft = startScrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
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

        {/* Sleek continuous scroll indicator track */}
        <div className="admin-floating-nav__track-wrap" aria-hidden="true">
          <div className="admin-floating-nav__track">
            <div
              className="admin-floating-nav__track-thumb"
              style={{
                transform: `translateX(${scrollProgress * 26}px)`,
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
