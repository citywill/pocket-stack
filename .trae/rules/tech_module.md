# 模块开发

如果开发`{module}`模块，则遵循以下规则：
- 位置：模块页面存放在 `src/modules/{module}` 目录下，文件命名遵循大驼峰。
- 包定义：每个模块要有一个包定义文件 `src/modules/{module}/package.json` 。文件中定义包名、标题、版本、描述、依赖、同级依赖。依赖不要和系统依赖（根目录下的`/package.json`）冲突、重复。
- 菜单：菜单设置位于`src/modules/{module}/menu.ts`文件。
- 路由：路由设置位于`src/modules/{module}/routes.tsx`文件，页面的访问路径为 `/{module}/{page}`。
- 组件：模块组件存放在 `src/modules/{module}/components/` 目录下。
- 后端：pocketbase 数据集 （`collection`）命名以模块名为前缀，例如 `{module}_name`。
