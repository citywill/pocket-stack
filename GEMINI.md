# 全栈开发框架

## 后端

- 采用 pocketbase 实现后端认证和接口服务。
- 请使用mcp操作 pocketbase
- 普通用户账号密码：demo@example.com / demo1234
- 管理员账号密码：admin@example.com / admin123

## 前端

当前项目用 shadcn create 创建项目，下面的命令定义了项目创建的参数，请遵守该风格协定，不要轻易修改。

```bash
npx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=maia&baseColor=neutral&theme=blue&iconLibrary=hugeicons&font=inter&menuAccent=subtle&menuColor=default&radius=large&template=next" --template next
```

### 项目结构

- 页面路由在 `src/App.tsx` 文件中注册。
- 侧边栏菜单在 `src/components/layout/Sidebar.tsx` 文件中注册。
- 页面存放在 `src/pages` 目录下，文件命名遵循大驼峰。
- 组件存放在 `src/components` 目录下
- 通用UI组件存放在 `src/components/ui` 目录下
- 后端调用库文件位于 `src/lib/pocketbase.ts`
- 前端页面示例位于 `src/pages/examples` 目录下

### 整体风格

- 使用 shadcn/ui，可以使用mcp操作添加组件
- 使用 blue 主题色
- 使用 maia 风格
- 使用圆角 `rounded-2xl`
- 图标组件使用： `hugeicons`，请使用mcp选择和使用icon图标
- 请参考前端页面示例 `src/pages/examples/` 中的示例文件，保持页面一致性