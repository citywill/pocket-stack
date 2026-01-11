import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { BlogDetail } from './BlogDetail';
import { LandingPage } from './LandingPage';

/**
 * Portal 模块路由配置
 * 包含了公开路由和受保护路由
 */
export const PortalRoutes = (
    <Route path="portal">
        {/* 公开访问的路由 */}
        <Route path="landing" element={<LandingPage />} />

        {/* 需要登录访问的路由 */}
        <Route element={<ProtectedRoute />}>
            <Route path="blog-detail" element={<BlogDetail />} />
        </Route>
    </Route>
);
