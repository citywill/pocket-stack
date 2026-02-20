import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import Notes from './Notes';

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route path="/">
      <Route index element={<Notes />} />
    </Route>
  </Route>
);
