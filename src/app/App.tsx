import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { PortalLayout } from '../layouts/PortalLayout';
import { HomePage } from '../pages/public/HomePage';
import { FestivalPage } from '../pages/public/FestivalPage';
import { RunPage } from '../pages/public/RunPage';
import { ActivitiesPage } from '../pages/public/ActivitiesPage';
import { NewsPage } from '../pages/public/NewsPage';
import { NewsArticlePage } from '../pages/public/NewsArticlePage';
import { GalleryPage } from '../pages/public/GalleryPage';
import { SponsorsPage } from '../pages/public/SponsorsPage';
import { AboutPage } from '../pages/public/AboutPage';
import { PolicyPage } from '../pages/public/PolicyPage';
import { RunRegistrationPage } from '../pages/public/RunRegistrationPage';
import { RequireSignIn } from '../features/auth/RequireSignIn';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'; 
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from '../pages/auth/AuthCallbackPage';
import { RunnerAuthPage } from '../pages/auth/RunnerAuthPage';
import { AccountPage } from '../pages/auth/AccountPage';
import { JoinStaffPage } from '../pages/auth/JoinStaffPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ActivitiesManagerPage } from '../pages/admin/ActivitiesManagerPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { PostsManagerPage } from '../pages/admin/PostsManagerPage';
import { RegistrationsManagerPage } from '../pages/admin/RegistrationsManagerPage';
import { UsersManagerPage } from '../pages/admin/UsersManagerPage';
import { FinancePage } from '../pages/admin/FinancePage';
import { SponsorsManagerPage } from '../pages/admin/SponsorsManagerPage';
import { GalleryManagerPage } from '../pages/admin/GalleryManagerPage';
import { DelegationsManagerPage } from '../pages/admin/DelegationsManagerPage';
import { AuditLogsManagerPage } from '../pages/admin/AuditLogsManagerPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { ScrollToTop } from '../components/ScrollToTop';
import { DocumentTitleManager } from '../components/DocumentTitleManager';
import { InstallAppPrompt } from '../components/InstallAppPrompt';
import { RequireRole } from '../features/auth/RequireRole';
import { useAuth } from '../features/auth/useAuth';

const RunTimingPage = lazy(() => import('../pages/admin/RunTimingPage').then((module) => ({ default: module.RunTimingPage })));
const KitClaimsManagerPage = lazy(() => import('../pages/admin/KitClaimsManagerPage').then((module) => ({ default: module.KitClaimsManagerPage })));

function CommitteeWorkspaceIndex() {
  const { isSuperAdmin, isAdmin, canAccess } = useAuth();

  if (isSuperAdmin || isAdmin || canAccess('overview')) return <AdminDashboardPage />;
  if (canAccess('registrations')) return <Navigate to="/admin/registrations" replace />;
  if (canAccess('kit_claims')) return <Navigate to="/admin/kit-claims" replace />;
  if (canAccess('run_timing')) return <Navigate to="/admin/run-timing" replace />;
  if (canAccess('activities')) return <Navigate to="/admin/activities" replace />;
  if (canAccess('posts')) return <Navigate to="/admin/posts" replace />;
  if (canAccess('delegations')) return <Navigate to="/admin/delegations" replace />;
  if (canAccess('finance')) return <Navigate to="/admin/finance" replace />;
  if (canAccess('sponsors')) return <Navigate to="/admin/sponsors" replace />;
  if (canAccess('gallery')) return <Navigate to="/admin/gallery" replace />;
  if (canAccess('audit')) return <Navigate to="/admin/audit" replace />;
  if (canAccess('settings')) return <Navigate to="/admin/settings" replace />;
  if (canAccess('users')) return <Navigate to="/admin/users" replace />;

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <DocumentTitleManager />
    <InstallAppPrompt />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/festival" element={<FestivalPage />} />
        <Route path="/festival/participants" element={<FestivalPage section="participants" />} />
        <Route path="/festival/guidelines" element={<FestivalPage section="guidelines" />} />
        <Route path="/run" element={<RunPage />} />
        <Route path="/run/routes" element={<RunPage section="routes" />} />
        <Route path="/run/register" element={<RequireSignIn><RunRegistrationPage /></RequireSignIn>} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/masses" element={<ActivitiesPage filter="mass" />} />
        <Route path="/activities/nightly" element={<ActivitiesPage filter="nightly" />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsArticlePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PolicyPage type="privacy" />} />
        <Route path="/terms" element={<PolicyPage type="terms" />} />

        {/* Single runner entry: Sign in + Sign up tabs */}
        <Route path="/signin" element={<RunnerAuthPage />} />
        <Route path="/signup" element={<Navigate to="/signin?mode=signup" replace />} />
        <Route path="/runner/login" element={<Navigate to="/signin" replace />} />
        <Route path="/account" element={<AccountPage />} />

        {/* Committee staff only */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join-staff" element={<JoinStaffPage />} />
        <Route path="/admin/join" element={<Navigate to="/join-staff" replace />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<RequireRole role="staff" />}>
        <Route path="/admin" element={<PortalLayout />}>
          <Route index element={<CommitteeWorkspaceIndex />} />

          <Route element={<RequireRole permission="activities" />}>
            <Route path="activities" element={<ActivitiesManagerPage />} />
          </Route>
          <Route element={<RequireRole permission="settings" />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route element={<RequireRole permission="registrations" />}>
            <Route path="registrations" element={<RegistrationsManagerPage />} />
          </Route>
          <Route element={<RequireRole permission="kit_claims" />}>
            <Route path="kit-claims" element={<Suspense fallback={<div className="admin-page">Loading kit claims…</div>}><KitClaimsManagerPage /></Suspense>} />
          </Route>
          <Route element={<RequireRole permission="run_timing" />}>
            <Route path="run-timing" element={<Suspense fallback={<div className="admin-page">Loading race timing…</div>}><RunTimingPage /></Suspense>} />
          </Route>
          <Route element={<RequireRole permission="users" />}>
            <Route path="users" element={<UsersManagerPage />} />
          </Route>
          <Route element={<RequireRole permission="finance" />}>
            <Route path="finance" element={<FinancePage />} />
          </Route>
          <Route element={<RequireRole permission="sponsors" />}>
            <Route path="sponsors" element={<SponsorsManagerPage />} />
          </Route>
          <Route element={<RequireRole permission="gallery" />}>
            <Route path="gallery" element={<GalleryManagerPage />} />
          </Route>
          <Route element={<RequireRole permission="audit" />}>
            <Route path="audit" element={<AuditLogsManagerPage />} />
          </Route>
          <Route element={<RequireRole permission="posts" />}>
            <Route path="posts" element={<PostsManagerPage />} />
          </Route>
          <Route element={<RequireRole permission="delegations" />}>
            <Route path="delegations" element={<DelegationsManagerPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
    </Routes>
    </>
  );
}
