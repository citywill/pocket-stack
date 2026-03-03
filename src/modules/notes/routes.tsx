import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { lazy } from 'react';
import { MainLayout } from '@/components/layout';

const Notes = lazy(() => import('./Notes'));
const Tags = lazy(() => import('./Tags'));
const AIGens = lazy(() => import('./AIGens'));
const Prompts = lazy(() => import('./Prompts'));

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="notes/tags" element={<Tags />} />
      <Route path="notes/aigens" element={<AIGens />} />
      <Route path="notes/prompts" element={<Prompts />} />
      <Route path="/notes">
        <Route index element={<Notes />} />
      </Route>
    </Route>
  </Route>
);
