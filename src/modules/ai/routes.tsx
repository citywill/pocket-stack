import { Route } from 'react-router-dom';
import { AIPlayground } from './AIPlayground';
import { AIAgents } from './AIAgents';
import { ProtectedRoute, AdminOnlyRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';

export const routes = (
  <>
    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="ai/playground" element={<AIPlayground />} />
        <Route element={<AdminOnlyRoute />}>
          <Route path="ai/agents" element={<AIAgents />} />
        </Route>
      </Route>
    </Route>
  </>
);
