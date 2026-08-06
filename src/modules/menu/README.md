# 菜单管理模块（@pocketstack/menu）

用于管理系统的侧边栏菜单，支持菜单的层级结构、图标配置、排序、显示控制、角色限制等功能。可与系统「设置 → 菜单设置」配合，将自定义菜单合并到默认模块菜单中显示。

## 目录结构

```
src/modules/menu/
├── MenuManager.tsx              # 菜单管理主页面（树形展示、增删改查）
├── menu.ts                      # 模块自身菜单注册（仅管理员可见）
├── routes.tsx                  # 路由定义
├── systemMenu.ts               # 系统菜单加载逻辑（从 PocketBase 读取并构建菜单树）
├── types.ts                    # 类型定义
├── package.json                # 模块包定义
├── README.md                   # 本文档
├── components/
│   └── MenuItemFormDrawer.tsx  # 菜单项表单抽屉（新增/编辑）
└── migrations/
    └── menu_items.json         # PocketBase 数据集定义（system_menu）
```

## 数据集

### `system_menu`

存储菜单项数据，主要字段：

| 字段         | 类型     | 必填 | 说明                                                       |
| ------------ | -------- | ---- | ---------------------------------------------------------- |
| `title`      | text     | 是   | 菜单标题                                                   |
| `parent`     | relation | 否   | 父菜单 ID（自关联，实现层级结构）                          |
| `path`       | text     | 否   | 路由路径                                                   |
| `icon`       | text     | 否   | heroicons 图标名称（来自 24/outline）                      |
| `order`      | number   | 否   | 排序权重，越小越靠前，默认 999                             |
| `external`   | bool     | 否   | 是否为外部链接（在新窗口打开）                             |
| `show`       | bool     | 否   | 是否在侧边栏显示                                           |
| `userOnly`   | bool     | 否   | 仅普通用户可见                                             |
| `adminOnly`  | bool     | 否   | 仅管理员可见                                               |
| `created`    | autodate | -   | 创建时间（自动）                                           |
| `updated`    | autodate | -   | 更新时间（自动）                                           |

## 权限规则

- **路由**：通过 `ProtectedRoute` 包裹，需登录访问
- **菜单**：`adminOnly: true`，仅超级管理员可见菜单管理入口
- **数据集规则**：
  - `listRule` / `viewRule`：空（任何登录用户可读）
  - `createRule` / `updateRule` / `deleteRule`：`@request.auth.id != ""`（任何登录用户可写）

> 通常配合「设置 → 菜单设置」开关启用自定义菜单，未启用时数据集的菜单不会渲染到侧边栏。

## 主要功能

- 树形结构展示菜单项，支持展开/折叠
- 新增、编辑、删除菜单项
- 自定义图标（基于 heroicons/24/outline）
- **排序控制**：通过 `order` 字段控制菜单显示顺序
- **显示控制**：通过 `show` 开关隐藏菜单（保留数据但不显示）
- **角色控制**：通过 `userOnly` / `adminOnly` 限制菜单可见性
- **外链支持**：通过 `external` 标记外部链接（新窗口打开）
- **徽章展示**：列表中以彩色徽章显示菜单属性（隐藏 / 管理员 / 普通用户 / 外链 / #order）

## 自定义菜单的生效流程

1. 管理员在「菜单管理」中创建菜单项，设置 `order`、`userOnly`、`adminOnly` 等属性
2. 管理员进入「设置 → 菜单设置」，开启「启用自定义菜单」开关并保存
3. 侧边栏会自动加载 `system_menu` 中的菜单项，合并到默认模块菜单**之后**显示
4. 根据 `order` 排序，根据当前用户角色应用 `adminOnly` / `userOnly` 过滤
5. 关闭开关则恢复仅使用默认模块菜单

> 自定义菜单不会覆盖默认模块菜单，而是追加在后。如需完全使用自定义菜单，请在「模块管理」中关闭对应模块的「显示菜单」开关。

## 使用说明

1. 管理员登录后，在侧边栏点击「菜单管理」进入
2. 点击「创建菜单」按钮，填写标题、路径、图标名称等
3. 通过设置 `parent` 字段构建多级菜单
4. 通过 `order` 字段控制同级菜单的显示顺序（数字越小越靠前，默认 999）
5. 取消 `show` 可隐藏菜单项（保留数据但不在侧边栏显示）
6. 启用 `adminOnly` 或 `userOnly` 可限制菜单仅对特定角色可见
7. 启用 `external` 可标记为外部链接（点击时在新窗口打开）
8. 编辑或删除菜单后，系统菜单缓存会自动清除，下次访问侧边栏时刷新

## 图标说明

图标采用 `@heroicons/react/24/outline` 库，填写图标组件名称即可，例如：

- `Bars3Icon`
- `HomeIcon`
- `ChartBarIcon`
- `Cog6ToothIcon`

完整图标列表参考：https://heroicons.com

## 相关模块

- **设置模块**（`@pocketstack/settings`）：提供「菜单设置」Tab，控制是否启用自定义菜单
- **模块管理**（`@pocketstack/modules`）：通过 `show_menu` 开关控制模块菜单的显隐
- **公共组件**（`@/components/menu.ts`）：模块菜单自动加载与合并逻辑、按模块隐藏过滤

## 排序字段说明

> **重要**：本模块统一使用 `order` 字段进行排序，不再使用 `sort` 字段。

- `order`：菜单显示权重，**越小越靠前**，默认 999
- PocketBase 查询使用 `sort: 'order'` 排序
- 前端构建菜单树时也按 `order` 字段排序根节点和子节点
