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

export const ExampleRoutes = (
  <>
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<MainLayout />}>
        <Route path="examples/blank" element={<Blank />} />
        <Route path="/" element={<ExampleDashboard />} />
        <Route path="examples/table" element={<ExampleTable />} />
        <Route path="examples/curd" element={<CurdExample />} />
        <Route path="examples/card" element={<ExampleCard />} />
        <Route path="examples/form" element={<Form />} />
        <Route path="examples/loading" element={<Loading />} />
      </Route>
    </Route>
    <Route path="examples/portal">
      {/* 公开访问的路由 */}
      <Route path="landing" element={<LandingPage />} />

      {/* 需要登录访问的路由 */}
      <Route element={<ProtectedRoute />}>
        <Route path="blog-detail" element={<BlogDetail />} />
      </Route>
    </Route>
  </>
);
