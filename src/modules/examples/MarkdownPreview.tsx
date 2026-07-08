import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import 'github-markdown-css/github-markdown-light.css';
import '@/markdown.css';

const sampleMarkdown = `# Markdown 渲染示例

## 文本样式

这是**粗体文本**，这是*斜体文本*，这是~~删除线~~，这是\`行内代码\`。

> 这是一条引用。PocketStack 基于 React + shadcn/ui + PocketBase，支持 Vibe Coding。

## 列表

### 无序列表

- 第一项
- 第二项
  - 嵌套项 2.1
  - 嵌套项 2.2
- 第三项

### 有序列表

1. 安装依赖
2. 配置环境
3. 启动项目

### 任务列表

- [x] 已完成任务
- [ ] 待完成任务
- [ ] 另一项任务

## 代码块

\`\`\`typescript
import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
\`\`\`

## 表格

| 名称 | 版本 | 描述 |
|------|------|------|
| React | 19.x | UI 框架 |
| PocketBase | 0.26 | 后端服务 |
| Tailwind CSS | v4 | 样式框架 |
| shadcn/ui | latest | 组件库 |

## 链接与图片

[PocketStack GitHub](https://github.com/citywill/pocket-stack)

![PocketStack](https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop)

## 分割线

---

## HTML 内容

<div style="padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
  <strong>提示：</strong>这是一段 HTML 内容，使用 rehype-raw 渲染。
</div>
`;

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState(sampleMarkdown);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <DocumentTextIcon className="h-8 w-8 text-primary" />
          Markdown 渲染示例
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          展示基于 github-markdown-css + react-markdown 的完整渲染效果。
        </p>
      </div>

      <Tabs defaultValue="render" className="w-full">
        <TabsList className="rounded-xl">
          <TabsTrigger value="render" className="rounded-xl">渲染效果</TabsTrigger>
          <TabsTrigger value="edit" className="rounded-xl">编辑预览</TabsTrigger>
        </TabsList>
        <TabsContent value="render" className="mt-4">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-primary" />
                渲染结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="edit" className="mt-4">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">编辑 Markdown</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full min-h-[400px] p-4 font-mono text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
