import { useEffect, useState } from 'react';
import { Calendar, CircleDollarSign, Newspaper, Users, Plus, ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
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

      <Card as="section" variant="outlined" className="admin-panel">
        <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Launch readiness</h2>
            <p>Verification checklist before opening registration to participants.</p>
          </div>
          <Button
            to="/admin/settings"
            variant="text"
            size="small"
            leadingIcon={<ArrowRight size={14} aria-hidden />}
          >
            Edit settings
          </Button>
        </div>

        <div className="readiness-list">
          <div>
            <StatusBadge tone="success">Ready</StatusBadge>
            <span>
              <strong>Run categories, distances, and race kits</strong>
              <small>3K Fun Run (₱500), 5K Community Stride (₱800), 10K Fiesta Loop (₱1000) configured.</small>
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
      </Card>
    </div>
  );
}
