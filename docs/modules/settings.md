# 系统设置模块 (Settings)

系统设置模块提供系统全局配置的集中管理界面，支持通过插件式表单扩展配置项。

## 模块信息

| 属性 | 值 |
|------|-----|
| **包名** | `@pocketstack/settings` |
| **版本** | `1.0.0` |
| **类型** | `module` |
| **权限** | `adminOnly` (仅超级管理员) |

## 页面结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 系统设置 | `/settings` | 全局配置管理页面 |

## 界面截图

![系统设置页面](../assets/admin-system-settings.png)

## 功能特性

### 插件式表单架构（扩展自定义配置）

设置模块采用插件式架构，通过 `import.meta.glob` 动态加载 `components/SettingForms/` 目录下的所有表单组件。

新增配置表单只需在该目录下创建新的 `xxxForm.tsx` 文件，导出 `metadata` 和对应的表单组件即可自动注册。

如需添加新的配置项，可创建新的表单组件：

1. 在 `src/modules/settings/components/SettingForms/` 下创建 `YourForm.tsx`
2. 导出 `metadata` 对象，包含 `id`、`title`、`icon`、`presetSettings`
3. 导出表单组件函数 `YourForm`

### 全局配置表单 (GeneralSettingsForm)

当前已实现的表单，提供以下配置项：

| 配置项 Key | 名称 | 说明 |
|------------|------|------|
| `site_name` | 系统名称 | 显示在页面顶部的系统名称 |
| `contact_email` | 管理员邮箱 | 系统管理员的联系邮箱 |
| `footer_text` | 页脚文字 | 显示在页面底部的版权信息 |

### 配置保存机制

- 每个表单独立保存自己的配置项
- 配置通过 PocketBase `system_settings` collection 存储
- 保存后自动刷新全局设置状态

```typescript
export const metadata = {
    id: 'your_module',
    title: '你的配置',
    icon: YourIcon,
    presetSettings: [
        { key: 'your_key', label: '配置名称', description: '配置描述' },
    ],
};
```


## PocketBase Collection

模块使用 `system_settings` collection 存储配置数据：

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | text | 配置键名，唯一索引 |
| `value` | json | 配置值 |
| `description` | text | 配置描述 |