import { Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { lazy } from 'react';

const KanbanBoard = lazy(() => import('./Index'));
const KanbanCalendar = lazy(() => import('./Calendar'));

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="kanban" element={<KanbanBoard />} />
      <Route path="kanban/calendar" element={<KanbanCalendar />} />
    </Route>
  </Route>
);
