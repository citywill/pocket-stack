import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { MenuManager } from './MenuManager';
import { MainLayout } from '@/components/layout';

export const routes = (
    <Route element={<MainLayout />}>
        <Route element={<ProtectedRoute />}>
        <Route path="menu/*" element={<MenuManager />} />
        </Route>
    </Route>
);