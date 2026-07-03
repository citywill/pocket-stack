---
name: pocketstack
description: |
  PocketStack 全栈开发框架。基于 React + shadcn/ui + PocketBase，采用模块化架构。
  当用户需要以下操作时使用此 skill：
  (1) 创建新模块（module）、页面或组件
  (2) 配置路由、菜单或权限
  (3) 操作 PocketBase 后端（collection 创建、数据 CRUD）
  (4) 遵循项目前端风格（shadcn/ui 组件、heroicons 图标、主题色）
  (5) CRUD 页面开发（表格、表单、详情抽屉）
  (6) 开发完成后进行编译测试和浏览器测试
---

# PocketStack 开发

PocketStack 是基于 PocketBase 后端和 React 前端的全栈模块化开发框架。

## 工作流程

开发一个功能模块遵循以下步骤：

1. **创建模块** - 按照模块结构创建目录和文件
2. **后端** - 通过 PocketBase MCP 创建 collection
3. **前端页面** - 参考 examples 实现页面和组件
4. **路由和菜单** - 配置 routes.tsx 和 menu.ts（自动注册，无需手动导入主文件）
5. **测试** - 编译测试 + Chrome DevTools 浏览器测试

## 参考文件

- **快速开始（安装、初始化项目开发环境）**: 见 [initialization.md](references/initialization.md)
- **模块结构**: 见 [module.md](references/module.md)
- **前端风格**: 见 [frontend.md](references/frontend.md)
- **路由与菜单**: 见 [routing.md](references/routing.md)
- **后端开发**: 见 [backend.md](references/backend.md)
- **测试流程**: 见 [testing.md](references/testing.md)
- **开发示例**: 见 [example.md](references/example.md)

## 关键文件位置

| 用途 | 路径 |
|------|------|
| Pocketbase 可执行文件 | `.pocketbase/` |
| Pocketbase 实例 | `src/lib/pocketbase.ts` |
| 路由注册 | `src/App.tsx`（自动导入 modules 下的 routes） |
| 菜单注册 | `src/components/menu.ts`（自动导入 modules 下的 menu） |
| 公共组件 | `src/components/` |
| UI 组件 | `src/components/ui/` |
| 开发示例 | `src/modules/examples/` |
| 认证/权限组件 | `src/components/auth-provider.tsx`, `src/components/protected-route.tsx` |

## 关键约定

- 页面文件命名使用大驼峰（PascalCase）
- 页面访问路径为 `/{module}/{page}`
- 后端 collection 命名以模块名为前缀，例如 `{module}_subPageName`
- 主题色始终使用 CSS 变量 `primary`，禁止硬编码颜色
- 图标使用 `@heroicons/react/24/outline`
- 组件库使用 `shadcn/ui`，通过 MCP 添加组件
- 菜单和路由均从 modules 目录自动导入，无需手动注册
