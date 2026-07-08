# 系统设置

## 模块概述

系统设置模块，用于管理系统的全局配置参数。采用标签页布局，动态加载设置表单组件，支持扩展自定义设置项。

## 功能特性

- **全局配置**：站点名称、管理员邮箱、页脚文字等基础配置
- **标签页布局**：多标签页分组管理不同类型的设置项
- **动态加载**：自动扫描 `components/SettingForms/` 目录，动态注册设置表单
- **实时保存**：修改后一键保存到 PocketBase `system_settings` collection

## 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 系统设置 | `/settings` | 系统全局配置管理 |

## 权限

仅管理员（adminOnly）可访问。

## 数据模型

- `system_settings` - 存储系统配置键值对（迁移文件位于 `migrations/system_settings.json`）

## 扩展

如需添加新的设置分类，在 `components/SettingForms/` 目录下创建新的表单组件，导出 `metadata`（id、title、icon、presetSettings）即可自动注册。
