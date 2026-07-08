# 示例页面

## 模块概述

示例页面模块，包含各种示例页面和组件，展示系统功能和组件使用方法，供开发时参考。

## 功能特性

- **仪表盘**：数据可视化仪表盘，含统计卡片、趋势图表、饼图等
- **表格**：通用表格展示示例
- **CURD 示例**：完整的 CRUD 页面（表格列表 + 抽屉表单 + 抽屉详情 + 删除确认），参考 `curd/` 目录
- **表单**：表单组件使用示例
- **卡片**：卡片布局展示示例
- **AI 对话**：AI 聊天对话界面示例
- **Markdown 编辑器**：Markdown 编辑与实时预览
- **Markdown 渲染**：Markdown 内容渲染展示
- **落地页**：无需登录的公开落地页（游客可访问）
- **博客详情**：博客文章详情展示
- **Iframe**：内嵌 iframe 页面示例
- **加载中/空页面**：加载状态和空状态页面示例

## 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 仪表盘 | `/examples/dashboard` | 数据可视化仪表盘 |
| 空页面 | `/examples/blank` | 空白起始页面 |
| 表格 | `/examples/table` | 表格组件示例 |
| CURD 示例 | `/examples/curd` | 完整 CRUD 操作示例 |
| 卡片 | `/examples/card` | 卡片布局示例 |
| 表单 | `/examples/form` | 表单组件示例 |
| AI 对话 | `/examples/chat` | AI 聊天界面 |
| 加载中 | `/examples/loading` | 加载状态示例 |
| Markdown 编辑器 | `/examples/markdown` | Markdown 编辑与实时预览 |
| Markdown 渲染 | `/examples/markdown-render` | Markdown 内容渲染展示 |
| Iframe 示例 | `/examples/iframe` | 内嵌 iframe 页面 |
| 落地页 | `/examples/portal/landing` | 公开落地页（无需登录） |
| 博客详情 | `/examples/portal/blog-detail` | 博客详情页 |

## 数据模型

- `examples_posts` - CURD 示例的帖子数据（迁移文件位于 `curd/migrations/examples_posts.json`）
