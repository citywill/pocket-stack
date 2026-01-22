import { Route } from 'react-router-dom';
import NotebookList from './NotebookList';
import NotebookDetail from './NotebookDetail';
import BuilderManager from './BuilderManager';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';

export const NotebookRoutes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="notebook/list" element={<NotebookList />} />
      <Route path="notebook/builder" element={<BuilderManager />} />
      <Route path="notebook/:id" element={<NotebookDetail />} />
    </Route>
  </Route>
);
