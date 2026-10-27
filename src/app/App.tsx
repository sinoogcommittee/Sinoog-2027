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
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'; 
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from '../pages/auth/AuthCallbackPage';
import { RunnerAuthPage } from '../pages/auth/RunnerAuthPage';
import { AccountPage } from '../pages/auth/AccountPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminListPage } from '../pages/admin/AdminListPage';
import { ActivitiesManagerPage } from '../pages/admin/ActivitiesManagerPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { PostsManagerPage } from '../pages/admin/PostsManagerPage';
import { RegistrationsManagerPage } from '../pages/admin/RegistrationsManagerPage';
import { UsersManagerPage } from '../pages/admin/UsersManagerPage';
import { FinancePage } from '../pages/admin/FinancePage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { RequireAdmin } from '../components/RequireAdmin';
import { ScrollToTop } from '../components/ScrollToTop';
import { RequireRole } from '../features/auth/RequireRole';
import { useAuth } from '../features/auth/useAuth';

const RunTimingPage = lazy(() => import('../pages/admin/RunTimingPage').then((module) => ({ default: module.RunTimingPage })));

function CommitteeWorkspaceIndex() {
  const { isAdmin, isNewsInCharge, isDelegationHead } = useAuth();

  if (isAdmin) return <AdminDashboardPage />;
  if (isNewsInCharge) return <Navigate to="/admin/posts" replace />;
  if (isDelegationHead) return <Navigate to="/admin/delegations" replace />;

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/festival" element={<FestivalPage />} />
        <Route path="/festival/participants" element={<FestivalPage section="participants" />} />
        <Route path="/festival/guidelines" element={<FestivalPage section="guidelines" />} />
        <Route path="/run" element={<RunPage />} />
        <Route path="/run/routes" element={<RunPage section="routes" />} />
        <Route path="/run/register" element={<RunRegistrationPage />} />
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

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<RequireRole role="staff" />}>
        <Route path="/admin" element={<PortalLayout />}>
          <Route index element={<CommitteeWorkspaceIndex />} />

          <Route element={<RequireAdmin />}>
            <Route path="activities" element={<ActivitiesManagerPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="registrations" element={<RegistrationsManagerPage />} />
            <Route path="run-timing" element={<Suspense fallback={<div className="admin-page">Loading race timing…</div>}><RunTimingPage /></Suspense>} />
            <Route path="users" element={<UsersManagerPage />} />
            <Route path="finance" element={<FinancePage />} />
          </Route>

          <Route element={<RequireRole role="news_in_charge" />}>
            <Route path="posts" element={<PostsManagerPage />} />
          </Route>

          <Route element={<RequireRole role="delegation_head" />}>
            <Route path="delegations" element={<AdminListPage type="delegations" />} />
          </Route>
        </Route>
      </Route>

      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
    </Routes>
    </>
  );
}
