## 模块开发

如果开发`{module}`模块，则遵循以下规则：
- 页面：模块页面存放在 `src/modules/{module}` 目录下，文件命名遵循大驼峰。
- 组件：模块组件存放在 `src/modules/{module}/components/` 目录下
- 菜单：菜单设置位于`src/modules/{module}/menu.ts`文件
- 路由：路由设置位于`src/modules/{module}/routes.ts`文件，页面的访问路径为 `/{module}/{page}`
- 后端：后端模型collection命名以模块名为前缀，例如 `{module}_subPageName`。
