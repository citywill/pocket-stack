# 模块开发

## 模块结构

如果开发`{module}`模块，则遵循以下规则：
- 页面：模块页面存放在 `src/modules/{module}` 目录下，文件命名遵循大驼峰。
- 组件：模块组件存放在 `src/modules/{module}/components/` 目录下
- 菜单：菜单设置位于`src/modules/{module}/menu.ts`文件
- 路由：路由设置位于`src/modules/{module}/routes.tsx`文件，页面的访问路径为 `/{module}/{page}`
- 后端：后端模型collection命名以模块名为前缀，例如 `{module}_subPageName`。

## 菜单定义

菜单配置文件位于 `src/modules/{module}/menu.ts`。

- 必须导出名为 `menu` 的变量。
- 支持单菜单项或菜单数组。

示例：

```typescript
import { ChartBarIcon } from '@heroicons/react/24/outline';

export const menu = {
  title: '模块名称',
  icon: ChartBarIcon,
  path: '/module/list', 
  activePath: '^/module/', // 可选，手动指定菜单激活的路径匹配规则（正则或前缀）
  show: true,       // 可选，是否在侧边栏显示，默认为 true
  children: [ // 可选
    { title: '子页面', path: '/sub-path', show: true }
  ],
  adminOnly: true, // 可选，仅超级管理员可见
  userOnly: true   // 可选，仅普通用户可见
};
```

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