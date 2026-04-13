# Pocket Stack ：AI友好的全栈开发解决方案

基于 **React 19 + TypeScript + Vite + shadcn/ui + PocketBase** 构建的现代化、全栈后台管理系统脚手架。

本项采用 AI 友好的技术栈，并结合 Shadcn & PocketBase MCP，提供完整、流畅、全栈、98分的 Vibe Coding 开发体验。

![Pocket Stack 示例页面](assets/example-dashboard.png)

## 🌟 核心特性

- 🎨 **前端特性**：基于 shadcn/ui (Maia 风格) 与 Tailwind CSS v4，支持 Blue、Green、Red、Gray 四种主题颜色切换，内置亮色、深色、跟随系统模式。全站采用 [HeroIcons](https://heroicons.com/) 图标库。自适应 Desktop、Tablet 及 Mobile 布局。
- 🚀 **后端特性**：原生集成 [PocketBase](https://pocketbase.io/)，覆盖身份验证及数据存储。
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
├── pb_schemas/          # PocketBase 集合配置 (JSON)
└── src/
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
