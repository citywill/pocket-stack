## 开发规则

公共组件：
- 页面路由在 `src/App.tsx` 文件中注册。
- 公共组件存放在 `src/components/` 目录下
- 侧边栏菜单在 `src/components/menu.ts` 文件中注册。
- 页面存放在 `src/pages/` 目录下，文件命名遵循大驼峰。
- 通用UI组件存放在 `src/components/ui` 目录下
- 前端页面示例位于 `src/pages/examples` 目录下
- 后端调用库文件位于 `src/lib/pocketbase.ts`

如果开发`{module}`模块，则遵循以下规则：
- 页面：模块页面存放在 `src/pages/{module}` 目录下，文件命名遵循大驼峰。
- 组件：模块组件存放在 `src/pages/{module}/components/` 目录下
- 菜单：菜单设置位于`src/pages/{module}/menu.ts`文件
- 路由：路由设置位于`src/pages/{module}/routes.ts`文件，页面的访问路径为 `/{module}/{page}`
- 后端：后端模型collection命名以模块名为前缀，例如 `{module}_subPageName`。
