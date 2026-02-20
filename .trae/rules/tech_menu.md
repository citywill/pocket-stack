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