# 菜单管理模块（@pocketstack/menu）

用于管理系统的侧边栏菜单，支持菜单的层级结构、图标配置、排序、显示控制等功能。

## 目录结构

```
src/modules/menu/
├── MenuManager.tsx              # 菜单管理主页面（树形展示、增删改查）
├── menu.ts                      # 模块自身菜单注册（仅管理员可见）
├── routes.tsx                  # 路由定义
├── systemMenu.ts               # 系统菜单加载逻辑（从 PocketBase 读取并构建菜单树）
├── types.ts                    # 类型定义
├── package.json                # 模块包定义
├── components/
│   └── MenuItemFormDrawer.tsx  # 菜单项表单抽屉（新增/编辑）
└── migrations/
    └── menu_items.json         # PocketBase 数据集定义（system_menu）
```

## 数据集

### `system_menu`

存储菜单项数据，主要字段：

| 字段       | 类型     | 必填 | 说明                                    |
| ---------- | -------- | ---- | --------------------------------------- |
| `title`    | text     | 是   | 菜单标题                                |
| `parent`   | relation | 否   | 父菜单 ID（自关联，实现层级结构）       |
| `path`     | text     | 是   | 路由路径                                |
| `icon`     | text     | 是   | heroicons 图标名称（来自 24/outline）   |
| `sort`     | number   | 是   | 排序值（升序）                          |
| `external` | bool     | 否   | 是否为外部链接                          |
| `show`     | bool     | 否   | 是否在侧边栏显示                        |
| `created`  | autodate | -   | 创建时间（自动）                        |
| `updated`  | autodate | -   | 更新时间（自动）                        |

## 权限规则

- 路由：通过 `ProtectedRoute` 包裹，需登录访问
- 菜单：`adminOnly: true`，仅超级管理员可见菜单管理入口

## 主要功能

- 树形结构展示菜单项，支持展开/折叠
- 新增、编辑、删除菜单项
- 自定义图标（基于 heroicons/24/outline）
- 排序控制
- 显示/隐藏控制
- 支持外部链接

## 使用说明

1. 管理员登录后，在侧边栏点击"菜单管理"进入
2. 点击"新增"按钮创建菜单项，填写标题、路径、图标名称等
3. 通过设置 `parent` 字段构建多级菜单
4. 通过 `sort` 字段控制同级菜单的显示顺序
5. 取消 `show` 可隐藏菜单项（保留数据但不在侧边栏显示）

## 图标说明

图标采用 `@heroicons/react/24/outline` 库，填写图标组件名称即可，例如：

- `Bars3Icon`
- `HomeIcon`
- `ChartBarIcon`
- `Cog6ToothIcon`

完整图标列表参考：https://heroicons.com
