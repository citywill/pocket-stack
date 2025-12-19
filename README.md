# Shadcn Admin 后台管理系统

这是一个基于 **React 19 + TypeScript + Vite + shadcn/ui + PocketBase** 构建的现代化、全栈后台管理系统脚手架。

本项采用 AI 友好的技术栈，并结合 Shadcn & PocketBase MCP，提供完整、流畅的全栈 Vibe Coding 开发体验。

## 🌟 核心特性

- 🎨 **前端特性**：基于 shadcn/ui (Maia 风格) 与 Tailwind CSS v4，内置深色模式。全站采用 [HugeIcons](https://hugeicons.com/) 图标库。自适应 Desktop、Tablet 及 Mobile 布局。
- 🚀 **后端特性**：原生集成 [PocketBase](https://pocketbase.io/)，覆盖身份验证、RBAC 及数据存储。
- 🎪 **身份认证**：支持“超级管理员”与“普通管理员”登录模式。
- 🛡️ **权限控制**：
    - 路由级保护 (`ProtectedRoute`, `AdminOnlyRoute`)。
    - 侧边栏菜单根据角色动态过滤。
    - UI 自动根据权限进行降级或隐藏。

## 🌐 技术栈

| 领域          | 技术方案                     |
| :------------ | :--------------------------- |
| **框架**      | React 19 + TypeScript        |
| **构建工具**  | Vite                         |
| **UI 组件**   | shadcn/ui (@base-ui/react)   |
| **样式**      | Tailwind CSS v4 (Maia Style) |
| **路由**      | React Router v7              |
| **后端/认证** | PocketBase                   |
| **图标**      | HugeIcons React              |

## 📁 目录结构

```text
src/
├── components/
│   ├── layout/          # 布局组件 (Sidebar, Header, MainLayout)
│   ├── ui/              # shadcn/ui 组件库
│   ├── auth-provider.tsx # 权限上下文逻辑
│   └── protected-route.tsx # 路由守卫组件
├── pages/               # 业务页面 (login, dashboard, users 等)
├── lib/                 # 工具类 (pocketbase SDK, tailwind utils)
├── App.tsx              # 路由与 Provider 根配置
└── main.tsx             # 应用入口
```

## 🚀 快速开始

### 1. 启动后端 (PocketBase)
1. 下载 [PocketBase](https://pocketbase.io/docs/) 二进制文件。
2. 运行 `./pocketbase serve`。
3. 访问 `http://127.0.0.1:8090/_/` 创建管理员账号并配置集合。

### 2. 运行前端
```bash
# 进入前端目录
cd shadcn-admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
