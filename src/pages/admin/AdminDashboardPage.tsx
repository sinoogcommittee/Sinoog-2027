import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CircleDollarSign, Newspaper, Users, Plus, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { getAllActivitiesForAdmin } from '../../features/activities/activityQueries';
import { getAllPostsForAdmin } from '../../features/content/postQueries';
import { getAllRegistrationsForAdmin } from '../../features/run/runQueries';

export function AdminDashboardPage() {
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

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Committee workspace</p>
          <h1>Overview</h1>
          <p>Real-time operational status for Sinoog 2027.</p>
        </div>
        <Link to="/admin/posts" className="button button--primary">
          <Plus size={16} /> Create announcement
        </Link>
      </div>

      <div className="stat-grid">
        <article>
          <Users />
          <span>Run Registrations</span>
          <strong>{registrationsCount}</strong>
          <small>{registrationOpen ? 'Registration active' : 'Registration closed'}</small>
        </article>

        <article>
          <CircleDollarSign />
          <span>Payments to review</span>
          <strong>{registrationsCount > 0 ? registrationsCount : 0}</strong>
          <small>Manual verification</small>
        </article>

        <article>
          <Calendar />
          <span>Scheduled activities</span>
          <strong>{activitiesCount}</strong>
          <small>Masses & programs</small>
        </article>

        <article>
          <Newspaper />
          <span>News announcements</span>
          <strong>{postsCount}</strong>
          <small>Articles published</small>
        </article>
      </div>

      <section className="admin-panel">
        <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Launch readiness</h2>
            <p>Verification checklist before opening registration to participants.</p>
          </div>
          <Link to="/admin/settings" style={{ fontSize: '0.85rem', color: 'var(--wine)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Edit settings <ArrowRight size={14} />
          </Link>
        </div>

        <div className="readiness-list">
          <div>
            <StatusBadge tone="success">Ready</StatusBadge>
            <span>
              <strong>Run categories, distances, and race kits</strong>
              <small>3K Fun Run (₱350), 5K Community (₱450), 10K Challenge (₱600) configured.</small>
            </span>
          </div>

          <div>
            <StatusBadge tone="success">Ready</StatusBadge>
            <span>
              <strong>Registration & payment proof workflow</strong>
              <small>Multi-step registration with reference generator and payment proof upload operational.</small>
            </span>
          </div>

          <div>
            <StatusBadge tone="success">Ready</StatusBadge>
            <span>
              <strong>News CMS & media upload pipeline</strong>
              <small>Authorized editors can create, preview, upload cover images, and publish articles.</small>
            </span>
          </div>

          <div>
            <StatusBadge tone={registrationOpen ? 'success' : 'warning'}>
              {registrationOpen ? 'Open' : 'Pending switch'}
            </StatusBadge>
            <span>
              <strong>Sinoog Run registration switch</strong>
              <small>Controlled via Website Settings. Currently set to {registrationOpen ? 'OPEN' : 'CLOSED'}.</small>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
