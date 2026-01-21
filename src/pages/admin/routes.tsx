import { Route } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { Users } from './Users';
import { Settings } from './Settings';
import { Install } from './Install';
import { AdminOnlyRoute } from '@/components/protected-route';

/**
 * Admin 模块路由配置
 * 包含仪表盘、用户管理、系统设置和系统安装页面
 */
export const AdminRoutes = (
    <>
        <Route
            path="admin/dashboard"
            element={
                <AdminOnlyRoute>
                    <AdminDashboard />
                </AdminOnlyRoute>
            }
        />
        <Route
            path="admin/users"
            element={
                <AdminOnlyRoute>
                    <Users />
                </AdminOnlyRoute>
            }
        />
        <Route
            path="admin/settings"
            element={
                <AdminOnlyRoute>
                    <Settings />
                </AdminOnlyRoute>
            }
        />
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
