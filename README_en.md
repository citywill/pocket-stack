# Pocket Stack: AI-Friendly Full-Stack Development Solution

A modern, full-stack admin system scaffold built with **React 19 + TypeScript + Vite + shadcn/ui + PocketBase**.

This project adopts an AI-friendly tech stack and combines Shadcn & PocketBase MCP to provide a complete, smooth, full-stack, 98-point Vibe Coding development experience.

English | [简体中文](README.md)

![Pocket Stack Example Page](docs/assets/example-dashboard.png)

## 🎶 Vibe Coding Performance

98% of Pocket Stack's features were developed using Vibe Coding. After testing on multiple development agents, although results vary, all can complete development.

| IDE         | Model           | Score | Description                                                                                |
| ----------- | --------------- | ----- | ------------------------------------------------------------------------------------------ |
| Trae China  | Doubao-Seed-1.8 | 90    | Can achieve vibe development. Half the features work on first try, half need debug prompts |
| Trae Global | Ginimi-3-flash  | 95    | Can achieve vibe development. 20% of cases need debug prompts                              |
| Antigravity | Ginimi-3-flash  | 98    | Can achieve vibe development. Almost all work on first try                                 |
| Antigravity | Ginimi-3-Pro    | 98    | Can achieve vibe development. Almost perfect                                               |

## 🌟 Core Features

- 🎨 **Frontend Features**: Built with shadcn/ui (Maia style) and Tailwind CSS v4, with built-in dark mode. Uses heroicons library. Adaptive layout for Desktop, Tablet, and Mobile.
- 🚀 **Backend Features**: Native integration with [PocketBase](https://pocketbase.io/) for authentication and data storage.
- 🧩 **Modular Architecture**: Supports decoupled business module development. Each module independently configures routes (`routes.tsx`) and menus (`menu.ts`) for plug-and-play integration.
- 📋 **Business Example**: Built-in personal task management system with multi-state transitions, priority settings, and user data isolation.
- 🎪 **Authentication**: Supports "Super Admin" and "Regular Admin" login modes.
- 🛡️ **Permission Control**:
    - Route-level protection (`ProtectedRoute`, `AdminOnlyRoute`).
    - Sidebar menu dynamically filtered based on role.
    - UI automatically downgrades or hides based on permissions.
    - Backend API Rules ensure tenant/user-level data physical isolation.

## 🌐 Tech Stack

| Domain                 | Solution                     |
| :--------------------- | :--------------------------- |
| **Backend/Auth**       | PocketBase                   |
| **Frontend Framework** | React 19 + TypeScript        |
| **Build Tool**         | Vite                         |
| **UI Components**      | shadcn/ui (@base-ui/react)   |
| **Styling**            | Tailwind CSS v4 (Maia Style) |
| **Routing**            | React Router v7              |
| **Icons**              | Heroicons React              |

## 📁 Directory Structure

```text
├── docs/                # Documentation (VitePress)
├── migrations/          # Database migrations
├── public/              # Static assets
└── src/
    ├── assets/          # Resource files
    ├── components/
    │   ├── layout/      # Layout components (Sidebar, Header, MainLayout)
    │   ├── ui/          # shadcn/ui component library
    │   ├── auth-provider.tsx # Authentication context
    │   ├── menu.ts      # Global menu configuration
    │   ├── protected-route.tsx # Route guard
    │   └── theme-provider.tsx # Theme context
    ├── lib/             # Utilities (pocketbase, utils)
    ├── modules/         # Business modules
    │   └── examples/    # Example modules (CURD, AI Chat, Blog, etc.)
    │       ├── components/ # Module components
    │       ├── curd/    # CURD example
    │       ├── menu.ts  # Module menu
    │       └── routes.tsx # Module routes
    ├── pages/           # System pages
    │   ├── admin/       # Admin dashboard (Dashboard, Settings, Users)
    │   ├── Login.tsx    # Login page
    │   ├── Register.tsx # Register page
    │   └── Profile.tsx  # Profile page
    ├── App.tsx          # Root component
    └── main.tsx         # Entry point
```

## 🚀 Quick Start

### 1. Start Backend (PocketBase)
1. Download [PocketBase](https://pocketbase.io/docs/) binary file.
2. Run `./pocketbase serve`.
3. Visit `http://127.0.0.1:8090/_/` to create admin account and configure collections.

### 2. Run Frontend
```bash

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Backend Configuration (Optional)

If the project includes PocketBase Schemas files (located in `pb_schemas/`), you can import the configuration in the PocketBase admin panel.