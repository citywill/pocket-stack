# PocketStack 项目 Agent 协作规则

AI 友好的全栈模块化开发框架。基于 **React + shadcn/ui + PocketBase**，支持 Vibe Coding。

> 每次完成任务，都要创建任务日志。文件路径是 `docs/logs/YYYYMMDD-中文任务名.md`

---

## 1. 项目概览

- **定位**：非专业人员可用的 Vibe Coding 全栈开发平台
- **后端**：PocketBase（单二进制，集成鉴权 + 数据库 + 实时订阅）
- **前端**：React 19 + Vite 7 + TypeScript + Tailwind CSS v4
- **UI**：shadcn/ui（Maia 风格）+ Heroicons，支持 Blue / Green / Red / Gray 主题
- **文档站**：`docs/`，VitePress 构建

---

## 2. 技术栈

| 类别       | 选型                                                      |
| ---------- | --------------------------------------------------------- |
| 构建工具   | Vite 7、`pnpm` workspaces                                 |
| 框架       | React 19、React Router 7、TypeScript 5.9                  |
| UI         | shadcn/ui、Radix UI、Tailwind CSS v4、@heroicons/react   |
| 数据/后端  | PocketBase SDK 0.26（直接 HTTP 调用）                     |
| 表单       | react-hook-form                                           |
| 图表/地图  | Recharts、React Leaflet、React Day Picker                 |
| 拖拽/MD    | @hello-pangea/dnd、react-markdown + remark-gfm            |
| 工具       | date-fns、sonner（toast）、tailwind-merge、clsx           |
| 文档       | VitePress 2                                               |
| Lint       | ESLint 9、typescript-eslint                               |

---

## 3. 关键目录结构

```
.
├── docs/                     # 项目文档（VitePress 站点）
│   ├── .vitepress/           # 站点配置
│   ├── assets/               # 文档图片
│   ├── modules/              # 各业务模块说明
│   └── logs/                 # 任务日志（YYYYMMDD-中文任务名.md）
├── scripts/                  # 构建/部署脚本
├── src/                      # pocketstack 项目源代码
│   ├── assets/               # 静态资源
│   ├── components/           # 公共组件与 layout
│   │   ├── ui/               # shadcn/ui 组件（不要手写 UI）
│   │   ├── layout/           # Header / Sidebar / MainLayout
│   │   ├── auth-provider.tsx # 鉴权 Provider
│   │   └── protected-route.tsx
│   ├── lib/                  # 工具与 PocketBase 实例
│   │   └── pocketbase.ts     # 全局 PocketBase 客户端
│   ├── modules/              # 业务模块（自动注册路由和菜单）
│   │   ├── examples/         # 示例模块（curd、AiChat、BlogDetail…）
│   │   ├── modules/          # 系统：模块管理
│   │   ├── settings/         # 系统：设置
│   │   └── user/             # 系统：用户管理
│   ├── pages/                # 顶层页面（Login、Profile、NotFound…）
│   ├── App.tsx               # 路由根 + 自动导入 modules/*/routes.tsx
│   └── main.tsx
├── .trae/skills/             # AI Skills
│   └── pocketstack/          # PocketStack 开发技能
└── components.json           # shadcn 配置
```

---

## 4. 模块（Module）开发约定

每个业务模块放在 `src/modules/<module>/`，包含 `Index.tsx` / `routes.tsx` / `menu.ts` / `package.json` / `types.ts`，**新增模块后路由和菜单会自动注册**，无需手动改主入口。

- **目录命名**：kebab-case（`finance`、`notebooklm`）
- **页面文件**：大驼峰 PascalCase
- **页面路径**：`/{module}/{page}`，例如 `/finance/records`
- **后端 collection 命名**：`{module}_subPageName`，例如 `finance_records`
- **每个模块的 migrations/**：放置 PocketBase collection 的 JSON schema

---

## 5. Skills

| Skill          | 用途                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `pocketstack`  | PocketStack 全栈开发框架。创建模块、CRUD 页面、路由/菜单/权限、PocketBase collection、shadcn 组件、编译与浏览器测试 |

`.trae/skills/pocketstack/SKILL.md` 是主入口，references/ 下还有：
- `module.md`（模块结构）
- `frontend.md`（前端风格）
- `routing.md`（路由与菜单）
- `backend.md`（PocketBase 后端）
- `testing.md`（编译与浏览器测试）
- `example.md`（完整开发示例）

---

## 7. 关键约定（必须遵守）

- **UI 组件**：使用 `shadcn/ui`，通过 `shadcn-ui MCP` 添加，禁止手写新组件
- **图标**：统一 `@heroicons/react/24/outline`
- **颜色**：必须用 CSS 变量 `bg-primary` / `text-primary` 等，**禁止硬编码颜色**
- **国际化**：纯中文（项目面向国内用户）
- **代码风格**：函数组件 + Hooks；不要新增 class 组件
- **PocketBase**：统一从 `src/lib/pocketbase.ts` 导入客户端
- **表单**：使用 `react-hook-form`
- **类型**：TypeScript 严格模式，禁用 `any`（除非必要需注释）
- **日志**：完成任何任务都要在 `docs/logs/` 创建日志文件

---

## 7. 常用命令

```bash
pnpm install                  # 安装依赖
pnpm dev                      # 本地开发
pnpm build                    # 类型检查 + 生产构建
pnpm lint                     # ESLint
pnpm docs:dev                 # 启动 VitePress 文档
pnpm docs:build               # 构建文档站点
```

---

## 8. 测试与发布

- **编译测试**：`pnpm build`，必须通过类型检查
- **浏览器测试**：`Chrome DevTools MCP` 打开页面 → 截图 → 检查 console 是否有 error → 验证主要交互
- **更新文档**：新增模块 / 修改约定需同步更新 `docs/modules/<module>.md`

---

## 9. 任务日志格式

文件命名：`docs/logs/YYYYMMDD-中文任务名.md`

模板：

```markdown
# <任务标题>

## 背景
为什么做这件事

## 修改文件
- 路径 1
- 路径 2

## 修改内容
### <模块 / 文件>
- 改动点 1
- 改动点 2

## 测试
- 编译 / 浏览器验证结果
```
