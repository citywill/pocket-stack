import { Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { lazy } from 'react';

const KanbanBoard = lazy(() => import('./Index'));
const TaskLogPage = lazy(() => import('./TaskLog'));
const TaskDetail = lazy(() => import('./TaskDetail'));

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="kanban" element={<KanbanBoard />} />
      <Route path="kanban/logs" element={<TaskLogPage />} />
      <Route path="kanban/task/:id" element={<TaskDetail />} />
    </Route>
  </Route>
);
