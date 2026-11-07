import { useEffect, useState } from 'react';
import {
  Calendar,
  CircleDollarSign,
  Newspaper,
  Users,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { getAllActivitiesForAdmin } from '../../features/activities/activityQueries';
import { getAllPostsForAdmin } from '../../features/content/postQueries';
import { getAllRegistrationsForAdmin } from '../../features/run/runQueries';
import { useAuth } from '../../features/auth/useAuth';
import type { AdminPermission } from '../../features/auth/authState';
import {
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
} from '../../components/AdminNavIcons';

export function AdminDashboardPage() {
  const { canAccess } = useAuth();
  const [activitiesCount, setActivitiesCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [registrationsCount, setRegistrationsCount] = useState<number>(0);
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [ed, acts, posts, regs] = await Promise.all([
          getCurrentEdition(),
          getAllActivitiesForAdmin(),
          getAllPostsForAdmin(),
          getAllRegistrationsForAdmin(),
        ]);
        if (!mounted) return;
        setRegistrationOpen(ed.registration_open);
        setActivitiesCount(acts.length);
        setPostsCount(posts.length);
        setRegistrationsCount(regs.length);
      } catch (err: unknown) {
        console.warn('Dashboard metrics fetch notice:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const allShortcuts = [
    {
      title: 'Registrations',
      path: '/admin/registrations',
      icon: AdminRegistrationsIcon,
      category: 'Run Operations',
      description: 'Review participant signups, verify GCash payments, and assign bib/QR codes.',
      permission: 'registrations' as AdminPermission,
    },
    {
      title: 'Kit Claiming',
      path: '/admin/kit-claims',
      icon: AdminKitClaimIcon,
      category: 'Run Operations',
      description: 'Camera QR scanner, singlet check-in roster, and offline cache sync queue.',
      permission: 'kit_claims' as AdminPermission,
    },
    {
      title: 'Race Timing',
      path: '/admin/run-timing',
      icon: AdminTimingIcon,
      category: 'Run Operations',
      description: 'Staggered gun start clocks, finish line scanner, and live leaderboard.',
      permission: 'run_timing' as AdminPermission,
    },
    {
      title: 'Activities & Schedule',
      path: '/admin/activities',
      icon: AdminActivitiesIcon,
      category: 'Festival & Liturgy',
      description: 'Novena mass schedules, nightly cultural presentations, and event timeline.',
      permission: 'activities' as AdminPermission,
    },
    {
      title: 'Delegations',
      path: '/admin/delegations',
      icon: AdminDelegationsIcon,
      category: 'Festival & Liturgy',
      description: 'Contingent workspace, musical audio track uploads, and dancer rosters.',
      permission: 'delegations' as AdminPermission,
    },
    {
      title: 'News Posts',
      path: '/admin/posts',
      icon: AdminNewsIcon,
      category: 'Communications & Media',
      description: 'Parish announcements, newsletter bulletins, and editorial publishing.',
      permission: 'posts' as AdminPermission,
    },
    {
      title: 'Sponsors',
      path: '/admin/sponsors',
      icon: AdminSponsorsIcon,
      category: 'Communications & Media',
      description: 'Corporate and benefactors directory, sponsorship tiers, and logos.',
      permission: 'sponsors' as AdminPermission,
    },
    {
      title: 'Media Gallery',
      path: '/admin/gallery',
      icon: AdminGalleryIcon,
      category: 'Communications & Media',
      description: 'Photo and video albums, YouTube video embeds, and festival highlights.',
      permission: 'gallery' as AdminPermission,
    },
    {
      title: 'Users & Staff',
      path: '/admin/users',
      icon: AdminUsersIcon,
      category: 'Governance & System',
      description: 'Manage committee staff accounts, Google invite codes, and permissions.',
      permission: 'users' as AdminPermission,
    },
    {
      title: 'Financial Records',
      path: '/admin/finance',
      icon: AdminFinanceIcon,
      category: 'Governance & System',
      description: 'Cashbook ledger, registration & general funds, void logs, and CSV export.',
      permission: 'finance' as AdminPermission,
    },
    {
      title: 'Audit History',
      path: '/admin/audit',
      icon: AdminAuditIcon,
      category: 'Governance & System',
      description: 'Immutable security event logs, detail inspector, and RFC-4180 CSV export.',
      permission: 'audit' as AdminPermission,
    },
    {
      title: 'Website Settings',
      path: '/admin/settings',
      icon: AdminSettingsIcon,
      category: 'Governance & System',
      description: 'Edition parameters, registration toggle, emergency banner, and bib printing.',
      permission: 'settings' as AdminPermission,
    },
  ];

  const categories = [
    {
      name: 'Run Operations',
      description: 'Race registrations, singlet kit claims, and live staggered gun-start timing.',
      items: allShortcuts.filter((s) => s.category === 'Run Operations'),
    },
    {
      name: 'Festival & Liturgy',
      description: 'Novena mass schedules, nightly cultural presentations, and dance contingent workspaces.',
      items: allShortcuts.filter((s) => s.category === 'Festival & Liturgy'),
    },
    {
      name: 'Communications & Media',
      description: 'Parish news updates, corporate sponsors ranking, and photo/video albums.',
      items: allShortcuts.filter((s) => s.category === 'Communications & Media'),
    },
    {
      name: 'Governance & System',
      description: 'Committee staff invites, financial cashbook ledger, audit history, and website settings.',
      items: allShortcuts.filter((s) => s.category === 'Governance & System'),
    },
  ];

  const visibleCategories = categories
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="m3-admin-dashboard admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Committee workspace</p>
          <h1>Overview</h1>
          <p>Real-time operational status for Sinoog 2027.</p>
        </div>
        <Button to="/admin/posts" variant="filled" leadingIcon={<Plus size={16} aria-hidden />}>
          Create announcement
        </Button>
      </div>

      <div className="stat-grid">
        <Card as="article" variant="outlined">
          <Users size={22} aria-hidden />
          <span>Run Registrations</span>
          <strong>{registrationsCount}</strong>
        </Card>

        <Card as="article" variant="outlined">
          <CircleDollarSign size={22} aria-hidden />
          <span>Payments to review</span>
          <strong>{registrationsCount > 0 ? registrationsCount : 0}</strong>
        </Card>

        <Card as="article" variant="outlined">
          <Calendar size={22} aria-hidden />
          <span>Scheduled activities</span>
          <strong>{activitiesCount}</strong>
        </Card>

        <Card as="article" variant="outlined">
          <Newspaper size={22} aria-hidden />
          <span>News announcements</span>
          <strong>{postsCount}</strong>
        </Card>
      </div>

      {/* Workspace Page Shortcuts (replaces obsolete Launch readiness checklist) */}
      <section className="admin-shortcuts-section" aria-labelledby="shortcuts-heading">
        <div className="section-header">
          <div>
            <h2 id="shortcuts-heading">Workspace Page Shortcuts</h2>
            <p>Direct navigation to all committee management modules, race-day tools, and settings.</p>
          </div>
          <div className="registration-status-chip">
            {registrationOpen ? (
              <span className="status-pill status-pill--open">
                <CheckCircle size={14} aria-hidden="true" />
                <span>Run Registration: <strong>OPEN</strong></span>
              </span>
            ) : (
              <span className="status-pill status-pill--closed">
                <AlertCircle size={14} aria-hidden="true" />
                <span>Run Registration: <strong>CLOSED</strong></span>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {visibleCategories.map((group) => (
            <div key={group.name} className="admin-shortcuts-group">
              <div className="admin-shortcuts-group-header">
                <h3 className="admin-shortcuts-group-title">{group.name}</h3>
                <p className="admin-shortcuts-group-desc">{group.description}</p>
              </div>
              <div className="admin-shortcuts-grid">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="admin-shortcut-card"
                      title={`Open ${item.title}`}
                    >
                      <div className="admin-shortcut-icon-wrap">
                        <IconComponent />
                      </div>
                      <div className="admin-shortcut-body">
                        <div className="admin-shortcut-title-row">
                          <strong>{item.title}</strong>
                          <ArrowRight size={16} className="admin-shortcut-arrow" aria-hidden="true" />
                        </div>
                        <p>{item.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
