import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MdEditor from '@uiw/react-md-editor';

const DEFAULT_CONTENT = `# 欢迎使用 Markdown 编辑器

这是一个简单的 **Markdown** 富文本编辑器。

## 功能特点

- 左侧编辑，右侧实时预览
- 支持 GFM (GitHub Flavored Markdown)
- 支持代码高亮、表格、任务列表等

## 示例代码

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## 表格示例

| 功能 | 状态 |
|------|------|
| 编辑 | ✅ |
| 预览 | ✅ |
| GFM | ✅ |

## 任务列表

- [x] 创建编辑器
- [x] 添加预览功能
- [ ] 添加更多功能

---

开始编辑你的 Markdown 吧！
`;

export function MarkdownEditor() {
  const [content, setContent] = useState(DEFAULT_CONTENT);

  const handleChange = (value: string | undefined) => {
    setContent(value || '');
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Markdown 编辑器</h1>
        <p className="text-sm text-muted-foreground mt-1">支持 GFM 语法的富文本编辑器</p>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden !p-2">
        <CardContent className="flex-1 p-0 overflow-hidden" data-color-mode="light">
          <MdEditor
            value={content}
            onChange={handleChange}
            height="100%"
            preview="live"
            hideToolbar={false}
            style={{ height: '100%' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default MarkdownEditor;
