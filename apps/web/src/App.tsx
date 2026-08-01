import { lazy } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/login'));
const RegisterPage = lazy(() => import('./pages/register'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const CreateGroupPage = lazy(() => import('./pages/groups/create'));
const SettingsPage = lazy(() => import('./pages/settings'));
const CalendarPage = lazy(() => import('./pages/calendar'));
const GroupsPage = lazy(() => import('./pages/groups/index'));
const GroupDetailPage = lazy(() => import('./pages/groups/detail'));
const GroupChatPage = lazy(() => import('./pages/groups/chat'));
const GroupFilesPage = lazy(() => import('./pages/groups/files'));
const GroupCallPage = lazy(() => import('./pages/groups/call'));

export default function App() {
  return (
    <>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/" component={ProtectedRoute}>
        <Route path="/" component={DashboardPage} />
        <Route path="/groups" component={GroupsPage} />
        <Route path="/groups/create" component={CreateGroupPage} />
        <Route path="/groups/:id" component={GroupDetailPage} />
        <Route path="/groups/:id/chat" component={GroupChatPage} />
        <Route path="/groups/:id/files" component={GroupFilesPage} />
        <Route path="/groups/:id/call" component={GroupCallPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/settings" component={SettingsPage} />
      </Route>
    </>
  );
}
