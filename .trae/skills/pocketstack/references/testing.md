# 测试流程

开发完成后按以下顺序进行测试：

## 1. 编译测试

确保代码能够通过编译。运行：

```bash
npm run build
# 或先用 TypeScript 检查
npx tsc --noEmit
```

修复所有编译错误后再进行下一步。

## 2. 浏览器测试

使用 Chrome DevTools MCP 进行功能测试，确保：

- 页面能够正常加载
- 数据能通过表单创建
- 数据能正常编辑
- 数据能正常删除

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 普通用户 | demo@example.com | demo1234 |
| 管理员 | admin@example.com | admin12345 |
