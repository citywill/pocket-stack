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
import IframePage from './IframePage';

export const routes = (
  <>
    {/* 需要登录访问的路由 */}
    <Route element={<ProtectedRoute />}>
      {/** 后台管理框架布局，需要嵌套在 MainLayout 下 */}
      <Route path="/" element={<MainLayout />}>
        <Route path="examples/dashboard" element={<ExampleDashboard />} />
        <Route path="examples/blank" element={<Blank />} />
        <Route path="examples/table" element={<ExampleTable />} />
        <Route path="examples/curd" element={<CurdExample />} />
        <Route path="examples/card" element={<ExampleCard />} />
        <Route path="examples/form" element={<Form />} />
        <Route path="examples/loading" element={<Loading />} />
        <Route path="blog-detail" element={<BlogDetail />} />
        <Route path="examples/iframe" element={<IframePage />} />
      </Route>
    </Route>
    {/* 无需后台框架布局的页面 */}
    <Route path="examples/portal/landing" element={<LandingPage />} />
    <Route path="examples/portal/blog-detail" element={<BlogDetail />} />
  </>
);
