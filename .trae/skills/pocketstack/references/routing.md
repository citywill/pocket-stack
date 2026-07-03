# 路由与菜单

## 路由定义

路由配置文件位于 `src/modules/{module}/routes.tsx`，必须导出名为 `routes` 的变量。

路由会自动从 modules 目录导入，无需在 `src/App.tsx` 中手动注册。

### 路由布局与嵌套

```tsx
import { Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute, AdminOnlyRoute, UserOnlyRoute } from '@/components/protected-route';
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

        {/* 仅限超级管理员 */}
        <Route element={<AdminOnlyRoute />}>
          <Route path="module/admin" element={<AdminPage />} />
        </Route>

        {/* 仅限普通用户 */}
        <Route element={<UserOnlyRoute />}>
          <Route path="module/user-only" element={<UserOnlyPage />} />
        </Route>
      </Route>
    </Route>

    {/* 无需后台框架布局的独立页面（游客可访问） */}
    <Route path="module/landing" element={<LandingPage />} />
  </>
);
```

### 权限控制组件

| 组件 | 说明 |
|------|------|
| `<ProtectedRoute />` | 要求已登录（任意角色） |
| `<AdminOnlyRoute />` | 仅限超级管理员 |
| `<UserOnlyRoute />` | 仅限普通用户 |

## 菜单定义

菜单配置文件位于 `src/modules/{module}/menu.ts`，必须导出名为 `menu` 的变量。

菜单会自动从 modules 目录导入，无需在 `src/components/menu.ts` 中手动注册。

### 菜单项类型

```typescript
interface MenuItem {
  title: string;           // 菜单标题
  path?: string;           // 路由路径
  icon: any;               // heroicons 图标组件
  adminOnly?: boolean;     // 仅超级管理员可见
  userOnly?: boolean;      // 仅普通用户可见
  external?: boolean;      // 外部链接
  show?: boolean;          // 是否显示，默认 true
  activePath?: string;     // 手动指定激活路径匹配规则
  children?: {             // 子菜单
    title: string;
    path: string;
    adminOnly?: boolean;
    userOnly?: boolean;
    external?: boolean;
    show?: boolean;
  }[];
}
```

### 菜单示例

```typescript
import { ChartBarIcon } from '@heroicons/react/24/outline';

// 单个菜单项
export const menu = {
  title: '仪表盘',
  icon: ChartBarIcon,
  path: '/module/dashboard',
};

// 带子菜单
export const menu = {
  title: '模块名称',
  icon: ChartBarIcon,
  activePath: '^/module/',
  children: [
    { title: '列表', path: '/module/list' },
    { title: '管理', path: '/module/admin', adminOnly: true },
    { title: '外部链接', path: 'https://example.com', external: true },
    { title: '隐藏项', path: '/module/hidden', show: false },
  ],
};

// 导出菜单数组
export const menu = [
  { title: '页面A', icon: IconA, path: '/module/a' },
  { title: '页面B', icon: IconB, path: '/module/b' },
];
```
