import { Route } from 'react-router-dom';
import AiAssistant from './AiAssistant';
import { AIPlayground } from './AIPlayground';
import { AIAgents } from './AIAgents';
import { AdminOnlyRoute } from '@/components/protected-route';

export const AiAssistantRoutes = (
  <>
    <Route path="ai-assistant" element={<AiAssistant />} />
    <Route path="ai-playground" element={<AIPlayground />} />
    <Route path="ai-agents" element={
      <AdminOnlyRoute>
        <AIAgents />
      </AdminOnlyRoute>
    } />
  </>
);
