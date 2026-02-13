import { lazy } from 'react';
import { MainLayout } from '@/components/layout';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';

const OkrList = lazy(() => import('./OkrList'));
const OkrDetail = lazy(() => import('./OkrDetail'));
const TaskBoard = lazy(() => import('./TaskBoard'));

export const routes = (
    <Route element={<ProtectedRoute />}>
        <Route path="/okr/" element={<MainLayout />}>
            <Route path="list" element={<OkrList />} />
            <Route path="detail/:id" element={<OkrDetail />} />
            <Route path="board/:id" element={<TaskBoard />} />
        </Route>
    </Route>
);
