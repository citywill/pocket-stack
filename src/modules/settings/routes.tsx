import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminOnlyRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import { Settings } from './Settings';

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route element={<AdminOnlyRoute />}>
        <Route path="settings" element={<Settings />} />
      </Route>
    </Route>
  </Route>
);