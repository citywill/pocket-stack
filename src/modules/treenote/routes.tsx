import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import NoteList from './NoteList';
import NoteDetail from './components/NoteDetail';
import { CategoryManager } from './CategoryManager';

export const routes = (
  <>
    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="treenote/note" element={<NoteList />} />
        <Route path="treenote/note/:id" element={<NoteDetail />} />
        <Route path="treenote/category" element={<CategoryManager />} />
      </Route>
    </Route>
  </>
);