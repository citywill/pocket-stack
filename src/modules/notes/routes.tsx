import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { lazy } from 'react';

const Notes = lazy(() => import('./Notes'));
const Tags = lazy(() => import('./Tags'));
const AIGens = lazy(() => import('./AIGens'));

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route path="tags" element={<Tags />} />
    <Route path="aigens" element={<AIGens />} />
    <Route path="/">
      <Route index element={<Notes />} />
    </Route>
  </Route>
);
