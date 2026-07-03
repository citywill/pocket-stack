# 快速开始：安装、初始化项目开发环境

PocketStack 项目的安装和启动流程。

## 1. 克隆项目

```bash
git clone https://github.com/citywill/pocket-stack
cd pocket-stack
```

## 2. 下载 PocketBase

将 PocketBase 可执行文件下载到项目根目录：

- 前往 [PocketBase Releases](https://github.com/pocketbase/pocketbase/releases) 下载对应平台的可执行文件
- Windows: `pocketbase.exe`
- macOS/Linux: `pocketbase`

将下载的文件放置在项目根目录 `.pocketbase/` 下。

## 3. 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

## 4. 启动开发

```bash
npm run dev
# 或使用 pnpm
pnpm dev
```

该命令会同时启动 PocketBase 后端和 Vite 前端开发服务器。
