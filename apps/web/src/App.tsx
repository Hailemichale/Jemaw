import { lazy } from 'solid-js';
import { Route } from '@solidjs/router';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/login'));
const RegisterPage = lazy(() => import('./pages/register'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const CreateGroupPage = lazy(() => import('./pages/groups/create'));
const SettingsPage = lazy(() => import('./pages/settings'));
const CalendarPage = lazy(() => import('./pages/calendar'));
const GroupsPage = lazy(() => import('./pages/groups/index'));
const GroupDetailPage = lazy(() => import('./pages/groups/detail'));

export default function App() {
  return (
    <>
      <Route path="/" component={DashboardPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/groups" component={GroupsPage} />
      <Route path="/groups/create" component={CreateGroupPage} />
      <Route path="/groups/:id" component={GroupDetailPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/settings" component={SettingsPage} />
    </>
  );
}
