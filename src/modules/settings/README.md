# 系统设置

## 模块概述

系统设置模块，用于集中管理「系统级全局配置 + 各模块自定义设置」。系统设置页自动注册模块的 `settings.tsx` 为 Tab，并依据声明式字段自动渲染表单，统一存储到 PocketBase `system_settings` collection。

## 功能特性

- **系统全局配置**：站点名称、管理员邮箱、页脚文字（key 前缀 `system_`）
- **模块设置自动注册**：任何模块在根目录提供 `settings.tsx` 即自动成为系统设置页的一个 Tab
- **字段 key 自动加前缀**：模块设置 key 自动加 `{模块名}_` 前缀，避免模块间 key 冲突
- **声明式自动渲染**：基于字段 `type`（text/textarea/number/switch/select）自动渲染控件，无需手写表单组件
- **统一存储与保存**：写入 `system_settings` collection，保存后自动刷新全局设置状态

## 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 系统设置 | `/settings` | 系统与各模块配置管理 |

## 权限

仅管理员（adminOnly）可访问。

## 数据模型

- `system_settings` - 存储系统配置键值对（迁移文件位于 `migrations/system_settings.json`）

## 如何为模块新增设置

1. 在模块根目录新建 `settings.tsx`，默认导出一个 `ModuleSettings` 对象：

```tsx
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import type { ModuleSettings } from '@/lib/module-settings';

const settings: ModuleSettings = {
  title: '我的模块',             // Tab 标题
  icon: Cog6ToothIcon,           // Tab 图标
  order: 20,                     // 可选，排序权重（越小越靠前）
  fields: [
    { type: 'switch', key: 'enable_xxx', label: '启用 xxx', defaultValue: false },
    { type: 'text', key: 'api_url', label: '接口地址', placeholder: 'https://...' },
  ],
};

export default settings;
```

2. 保存后，字段会以 `{模块名}_{fieldKey}`（如 `examples_enable_xxx`）存入 `system_settings`。

3. 模块代码中可通过 `useSettings().get('{模块名}_fieldKey')` 读取。

支持的字段类型：`text`、`textarea`、`number`、`switch`、`select`。更多用法参考 `src/modules/examples/settings.tsx`。
