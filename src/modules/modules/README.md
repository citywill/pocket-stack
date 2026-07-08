# 模块管理

## 模块概述

模块管理模块，用于查看和管理系统中所有业务模块的状态。自动扫描 `src/modules/` 目录下的模块，读取其 `package.json` 元数据和 `migrations/` 迁移文件，支持一键初始化模块数据到 PocketBase。

## 功能特性

- **模块列表**：自动扫描并展示所有模块的名称、版本、描述、迁移文件数量
- **状态管理**：显示每个模块的初始化状态（已初始化 / 未初始化）
- **一键初始化**：将模块的 `migrations/` 中的 collection schema 导入 PocketBase

## 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 模块管理 | `/modules` | 模块列表与初始化管理 |

## 权限

仅管理员（adminOnly）可访问。

## 数据模型

- `system_modules` - 存储各模块的初始化状态（迁移文件位于 `migrations/system_modules.json`）
