import { Route } from 'react-router-dom';
import { BlogDetail } from './BlogDetail';
import { LandingPage } from './LandingPage';

// 需要登录访问的路由
export const PortalProtectedRoutes = (
    <>
        <Route path="portal/blog-detail" element={<BlogDetail />} />
    </>
);

// 公开访问的路由
export const PortalPublicRoutes = (
    <>
        <Route path="portal/landing" element={<LandingPage />} />
    </>
);
