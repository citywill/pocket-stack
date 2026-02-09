import { Route } from 'react-router-dom';
import { ExampleDashboard } from './Dashboard';
import { ExampleTable } from './Table';
import { ExampleCard } from './Card';
import { Form } from './Form';
import { Blank } from './Blank';
import { Loading } from './Loading';
import CurdExample from './curd/Index';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import { BlogDetail } from './BlogDetail';
import { LandingPage } from './LandingPage';

export const routes = (
  <>
    {/* 需要登录访问的路由 */}
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<MainLayout />}>
        <Route path="examples/dashboard" element={<ExampleDashboard />} />
        <Route path="examples/blank" element={<Blank />} />
        <Route path="examples/table" element={<ExampleTable />} />
        <Route path="examples/curd" element={<CurdExample />} />
        <Route path="examples/card" element={<ExampleCard />} />
        <Route path="examples/form" element={<Form />} />
        <Route path="examples/loading" element={<Loading />} />

        <Route path="blog-detail" element={<BlogDetail />} />
      </Route>
    </Route>
    {/* 公开访问的路由，由于目前 autoRoutes 都在 MainLayout 下，
        如果需要脱离布局，可能需要后续调整 App.tsx 的加载机制 */}
    <Route path="examples/portal/landing" element={<LandingPage />} />
    <Route path="examples/portal/blog-detail" element={<BlogDetail />} />
  </>
);
