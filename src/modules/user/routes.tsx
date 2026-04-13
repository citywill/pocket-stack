import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminOnlyRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import { UserDashboard } from './UserDashboard';
import { UserList } from './UserList';

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route element={<AdminOnlyRoute />}>
      <Route path="/user" element={<UserDashboard />} />
      <Route path="/user/list" element={<UserList />} />
      </Route>
    </Route>
  </Route>
);