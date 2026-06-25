# 前端风格

## 技术栈

- 组件库：`shadcn/ui`，通过 MCP 操作添加组件
- 图标库：`@heroicons/react/24/outline`
- 主题色：通过 CSS 变量 `primary` 实现多主题切换
- 风格：`maia`
- 圆角：`rounded-2xl`
- 提示通知：`sonner`（`toast`）
- 日期处理：`date-fns`（`format`, `parseISO`）

## 图标使用

```tsx
import { BeakerIcon } from '@heroicons/react/24/outline';

<BeakerIcon className="size-6 text-primary" />
```

## 主题色规则

常规功能使用 CSS 变量 `primary`，禁止硬编码颜色值：

```tsx
// 正确
className="bg-primary text-primary-foreground"
className="bg-primary/10 text-primary"
className="hover:bg-primary/20"
className="border-primary/30 hover:border-primary/50"

// 错误（禁止）
className="bg-blue-600 text-white"
className="text-blue-500"
className="border-blue-200 dark:border-blue-800"
```

## 状态色

状态色保持原样，不参与主题切换：

```tsx
className="bg-green-500 text-green-600"   // 成功
className="bg-red-500 text-red-600"       // 错误
className="bg-amber-500 text-amber-600"   // 警告
```

## 布局组件

公共布局组件位于 `src/components/layout/`：
- `MainLayout`：后台管理框架布局（侧边栏 + 顶栏 + 内容区）
- `Header`：顶栏
- `Sidebar`：侧边栏
- `Footer`：页脚

## UI 组件

所有 shadcn/ui 组件位于 `src/components/ui/`，已包含：
`accordion`, `alert-dialog`, `avatar`, `badge`, `button`, `calendar`, `card`, `checkbox`, `combobox`, `dialog`, `dropdown-menu`, `field`, `input`, `input-group`, `label`, `map-picker`, `popover`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `slider`, `switch`, `table`, `tabs`, `textarea`

需要新组件时使用 MCP 添加 shadcn/ui 组件。
