# 全栈开发框架

## 后端

- 采用 pocketbase 实现后端认证和接口服务。
- 请使用mcp操作 pocketbase
- 普通用户账号密码：demo@example.com / demo1234
- 管理员账号密码：admin@example.com / admin123

## 开发规则

公共组件：
- 页面路由在 `src/App.tsx` 文件中注册。
- 公共组件存放在 `src/components/` 目录下
- 侧边栏菜单在 `src/components/layout/Sidebar.tsx` 文件中注册。
- 页面存放在 `src/pages/` 目录下，文件命名遵循大驼峰。
- 通用UI组件存放在 `src/components/ui` 目录下
- 前端页面示例位于 `src/pages/examples` 目录下
- 后端调用库文件位于 `src/lib/pocketbase.ts`

如果开发`{module}`模块，则遵循以下规则：
- 页面：模块页面存放在 `src/pages/{module}` 目录下，文件命名遵循大驼峰。
- 组件：模块组件存放在 `src/pages/{module}/components/` 目录下
- 菜单：如果模块有多个页面，则采用二级菜单
- 路由：页面的访问路径为 `/{module}/{page}`
- 后端：后端模型collection命名以模块名为前缀，例如 `{module}_table`。

## 前端风格

页面示例：请参考 `src/pages/examples/` 中的示例文件，保持页面一致性。

风格规则：
- 组件库： `shadcn/ui`，请使用mcp操作添加组件
- 主题色： `blue` 
- 风格： `maia` 
- 圆角： `rounded-2xl`
- 图标库： `hugeicons`，请使用mcp选择和使用icon图标