import { Navigate, Route, Routes } from 'react-router-dom';
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
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminListPage } from '../pages/admin/AdminListPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { RequireAdmin } from '../components/RequireAdmin';
export default function App() { return <Routes>
  <Route element={<PublicLayout/>}>
    <Route path="/" element={<HomePage/>}/><Route path="/festival" element={<FestivalPage/>}/><Route path="/festival/participants" element={<FestivalPage section="participants"/>}/><Route path="/festival/guidelines" element={<FestivalPage section="guidelines"/>}/>
    <Route path="/run" element={<RunPage/>}/><Route path="/run/routes" element={<RunPage section="routes"/>}/><Route path="/run/register" element={<RunRegistrationPage/>}/>
    <Route path="/activities" element={<ActivitiesPage/>}/><Route path="/activities/masses" element={<ActivitiesPage filter="mass"/>}/><Route path="/activities/nightly" element={<ActivitiesPage filter="nightly"/>}/>
    <Route path="/news" element={<NewsPage/>}/><Route path="/news/:slug" element={<NewsArticlePage/>}/><Route path="/gallery" element={<GalleryPage/>}/><Route path="/sponsors" element={<SponsorsPage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/privacy" element={<PolicyPage type="privacy"/>}/><Route path="/terms" element={<PolicyPage type="terms"/>}/><Route path="/login" element={<LoginPage/>}/><Route path="*" element={<NotFoundPage/>}/>
  </Route>
  <Route element={<RequireAdmin/>}><Route path="/admin" element={<PortalLayout/>}><Route index element={<AdminDashboardPage/>}/><Route path="registrations" element={<AdminListPage type="registrations"/>}/><Route path="delegations" element={<AdminListPage type="delegations"/>}/><Route path="posts" element={<AdminListPage type="posts"/>}/><Route path="activities" element={<AdminListPage type="activities"/>}/><Route path="users" element={<AdminListPage type="users"/>}/><Route path="settings" element={<AdminListPage type="settings"/>}/></Route></Route>
  <Route path="/dashboard" element={<Navigate to="/admin" replace/>}/>
</Routes>; }
