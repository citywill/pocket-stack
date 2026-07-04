# Pocket Stack ：AI友好的全栈开发解决方案

2026年，最好的技术方案就是最“AI友好”的技术方案。这是一套AI友好的前后端技术栈，结合规则提示词和MCP等技术，打造一个非专业人员可用的 Vibe Coding 开发环境。为“就缺一个程序员”的你提供一个阿拉丁神灯般的开发平台。

基于 React + shadcn/ui + PocketBase + MCP 等技术，实现完整、流畅的全栈 Vibe Coding 开发体验。

![Pocket Stack 示例页面](docs/assets/example-dashboard.png)

## 📄 更多信息

- [文档](https://citywill.github.io/pocket-stack/)

## 基于 PockeStack 的 Vibe Coding 图示

![Pocket Stack Vibe Coding 图示](docs/assets/diagram.png)

## 🌟 核心特性

- 🤖 **AI 友好**：结合项目中的`AGENTS.md`和[pocketstack skill](https://github.com/citywill/pocketstack-skill)，实现使用AI IDE（例如TRAE）或通用智能体（例如Codex等），完成项目的代码部署、环境配置、模块开发。
- 🎨 **前端特性**：基于 shadcn/ui (Maia 风格) 与 Tailwind CSS v4，支持 Blue、Green、Red、Gray 四种主题颜色切换，内置亮色、深色、跟随系统模式。全站采用 Heroicons 图标库。自适应 Desktop、Tablet 及 Mobile 布局。
- 🚀 **后端特性**：原生集成 [PocketBase](https://pocketbase.io/)，覆盖身份验证及数据存储。
- 🧩 **模块化架构**：支持业务模块解耦开发，每个模块独立定义组件（`components/`）、迁移文件（`migrations/`）、包定义（`package.json`）、路由 (`routes.tsx`) 与菜单 (`menu.ts`)，实现即插即用。
- 📋 **业务示例**：内置个人任务管理系统，支持多状态流转、优先级设定及用户数据隔离。
- 🎪 **身份认证**：支持“超级管理员”与“普通管理员”登录模式。
- 🛡️ **权限控制**：
    - 路由级保护 (`ProtectedRoute`, `AdminOnlyRoute`)。
    - 侧边栏菜单根据角色动态过滤。
    - UI 自动根据权限进行降级或隐藏。
    - 后端 API Rules 确保租户/用户级数据物理隔离。

## 🌐 技术栈

| 领域          | 技术方案                     |
| :------------ | :--------------------------- |
| **后端/认证** | PocketBase                   |
| **前端框架**  | React 19 + TypeScript        |
| **构建工具**  | Vite                         |
| **UI 组件**   | shadcn/ui (@base-ui/react)   |
| **样式**      | Tailwind CSS v4 (Maia Style) |
| **路由**      | React Router v7              |
| **图标**      | HeroIcons React              |

## 📁 目录结构

```text
├── .pocketbase/         # PocketBase 数据库目录
├── docs/                # 文档目录
├── public/              # 静态资源
└── src/
    ├── components/
    │   ├── layout/      # 布局组件 (Sidebar, Header, MainLayout)
    │   ├── ui/          # shadcn/ui 组件库
    │   ├── auth-provider.tsx # 认证上下文
    │   ├── menu.ts      # 全局菜单配置
    │   ├── protected-route.tsx # 路由守卫
    │   └── theme-provider.tsx # 主题上下文
    ├── lib/             # 工具库 (pocketbase, utils)
    ├── modules/         # 模块
    │   └── examples/    # 示例模块 (包含 CURD, AI Chat, Blog 等示例)
    │       ├── components/ # 模块组件
    │       ├── migrations/ # 模块数据库迁移文件
    │       ├── routes.tsx # 模块路由
    │       ├── menu.ts  # 模块菜单
    │       └── package.json # 模块包定义文件
    ├── pages/           # 系统页面
    │   ├── admin/       # 管理后台 (Dashboard, Settings, Users)
    │   ├── Login.tsx    # 登录页
    │   ├── Register.tsx # 注册页
    │   └── Profile.tsx  # 个人资料页
    ├── App.tsx          # 根组件
    └── main.tsx         # 入口文件
```

## 🚀 快速开始

建议使用`pocketstack skill`创建新的PocketStack项目。

例如，在agent中输入提示词：`在{指定目录下}初始化一个PocketStack项目，并运行开发环境`

也按以下步骤手动开始：

### 1. 克隆项目并初始化环境变量配置文件

```bash
git clone https://github.com/citywill/pocket-stack <项目目录名>
cd <项目目录名>
cp .env.example .env
```

> 项目目录名由用户指定，若用户未提供则默认为 `pocket-stack`。

### 2. 安装后端 (PocketBase)

将 PocketBase 可执行文件下载到项目根目录：

- 前往 [PocketBase Releases](https://github.com/pocketbase/pocketbase/releases) 下载对应平台的可执行文件
- Windows: `pocketbase.exe`
- macOS/Linux: `pocketbase`

将下载的文件放置在项目根目录 `.pocketbase/` 下。

### 3. 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

### 4. 启动开发环境

```bash
npm run dev
# 或使用 pnpm
pnpm dev
```

该命令会同时启动 PocketBase 后端和 Vite 前端开发服务器。

### 5. 配置PocketBase

在浏览器中访问 `http://127.0.0.1:8090/_/` 创建管理员账号并配置集合（开发环境建议使用默认账号密码 `admin@example.com/admin12345`）。

### 6. 初始化模块

在浏览器访问 `http://localhost:5173`，使用superuser账号登录，访问模块管理功能，即可初始化模块。

## 联系和讨论

添加微信好友，加微信入群，备注 pocketstack

<img src="docs/assets/weixin.png" width="200"/>