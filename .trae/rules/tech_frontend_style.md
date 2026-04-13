## 前端风格

请参考 `src/pages/examples/` 中的示例文件，保持页面一致性。

## 风格规则

- 组件库： `shadcn/ui`，请使用 MCP 操作添加组件
- 主题色： `primary`（通过 CSS 变量实现多主题切换）
- 风格： `maia`
- 圆角： `rounded-2xl`

### 主题色使用规则

**常规功能使用 CSS 变量 `primary` 作为主题色**，禁止使用硬编码颜色值。

```typescript
// 正确写法
className="bg-primary text-primary-foreground"
className="bg-primary/10 text-primary"
className="hover:bg-primary/20"

// 错误写法（禁止）
className="bg-blue-600 text-white"
className="text-blue-500"
```

### 状态色使用规则

状态色（成功、绿色、警告、错误）保持原样，不参与主题切换：

```typescript
className="bg-green-500 text-green-600"  // 成功状态
className="bg-red-500 text-red-600"      // 错误状态
className="bg-amber-500 text-amber-600"   // 警告状态
```

### 边框和背景

活跃状态和 hover 状态应使用透明色配合 primary：

```typescript
// 正确写法
className="border-primary/30 hover:border-primary/50"
className="bg-primary/10 hover:bg-primary/20"

// 错误写法
className="border-blue-200 dark:border-blue-800"
```