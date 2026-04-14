import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminOnlyRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import { Modules } from './Modules';

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route element={<AdminOnlyRoute />}>
        <Route path="modules" element={<Modules />} />
      </Route>
    </Route>
  </Route>
);
