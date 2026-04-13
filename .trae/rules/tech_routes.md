## 路由定义

路由配置文件位于 `src/modules/{module}/routes.tsx`。

- 必须导出名为 `routes` 的变量。
- 使用 React Router 的 `<Route>` 组件定义。
- 路由布局与嵌套
  - 后台管理页面：需要嵌套在和 `MainLayout` 中。
  - 公开页面/独立页面：直接定义 `Route`，不使用主布局。
- 权限控制
  - `<ProtectedRoute />`：要求已登录（任意角色）。
  - `<AdminOnlyRoute />`：仅限超级管理员访问。
  - `<UserOnlyRoute />`：仅限普通用户访问。

示例：

```tsx
import { Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute, AdminOnlyRoute } from '@/components/protected-route';
import { lazy } from 'react';

const ListPage = lazy(() => import('./ListPage'));
const AdminPage = lazy(() => import('./AdminPage'));
const LandingPage = lazy(() => import('./LandingPage'));

export const routes = (
  <>
    {/* 需要登录且使用后台框架布局的路由 */}
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<MainLayout />}>
        <Route path="module/list" element={<ListPage />} />
        
        {/* 仅限超级管理员访问的模块内页面 */}
        <Route element={<AdminOnlyRoute />}>
           <Route path="module/admin" element={<AdminPage />} />
        </Route>
      </Route>
    </Route>

    {/* 无需后台框架布局的独立页面 */}
    <Route path="module/landing" element={<LandingPage />} />
  </>
);
```