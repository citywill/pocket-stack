import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import { lazy } from 'react';

const Notes = lazy(() => import('./Notes'));
const Tags = lazy(() => import('./Tags'));

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route path="tags" element={<Tags />} />
    <Route path="/">
      <Route index element={<Notes />} />
    </Route>
  </Route>
);
