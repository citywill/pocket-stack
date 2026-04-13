import { Route } from 'react-router-dom';
import { Install } from './Install';
import { AdminOnlyRoute } from '@/components/protected-route';

export const AdminRoutes = (
    <>
        <Route
            path="admin/install"
            element={
                <AdminOnlyRoute>
                    <Install />
                </AdminOnlyRoute>
            }
        />
    </>
);