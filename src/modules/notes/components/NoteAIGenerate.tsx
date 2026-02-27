import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SparklesIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Tag {
  id: string;
  name: string;
}

interface Prompt {
  id: string;
  user: string;
  title: string;
  content: string;
  created: string;
}

interface Note {
  id: string;
  content: string;
  user: string;
  isDeleted?: boolean;
  noted: string;
  created: string;
  expand?: {
    user: {
      id: string;
      username: string;
      name: string;
    },
    note_tag_links_via_note?: {
      id: string;
      tag: string;
      expand?: {
        tag: Tag;
      }
    }[]
  }
}

interface NoteAIGenerateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: Note[];
  filter?: {
    activeFilter: string;
    activeFrom?: string | null;
    activeTo?: string | null;
    activeTag?: string | null;
  };
}

export function NoteAIGenerate({ open, onOpenChange, notes, filter }: NoteAIGenerateProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    if (user?.id && open) {
      fetchPrompts();
    }
  }, [user?.id, open]);

  const fetchPrompts = async () => {
    try {
      const result = await pb.collection('note_prompts').getList<Prompt>(1, 20, {
        filter: `user = "${user?.id}"`,
        sort: '-created',
        requestKey: null,
      });
      setPrompts(result.items);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setPrompt(prompt.content);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user?.id) return;

    setLoading(true);
    setResult('');

    try {
      const notesContent = notes.slice(0, 20).map((note, index) => {
        const tags = note.expand?.note_tag_links_via_note
          ?.map(link => link.expand?.tag?.name)
          .filter(Boolean)
          .join(', ');
        return `[笔记 ${index + 1}]\n日期: ${new Date(note.noted || note.created).toLocaleString()}\n${tags ? `标签: ${tags}\n` : ''}内容: ${note.content}`;
      }).join('\n\n---\n\n');

      const systemPrompt = `你是一个智能助手。用户给你提供了一些内容，请根据用户的请求进行回复。
      
当前筛选条件：
- 筛选类型: ${filter?.activeFilter === 'trash' ? '回收站' : '全部'}
${filter?.activeFrom ? `- 日期范围: ${filter.activeFrom} 至 ${filter.activeTo || filter.activeFrom}` : ''}
${filter?.activeTag ? `- 标签ID: ${filter.activeTag}` : ''}

请根据用户的请求，结合以下内容给出回复。`;

      const userContent = `以下是用户提供内容（共 ${notes.length} 条，这里显示前 20 条）：\n\n${notesContent}\n\n---\n\n用户请求：${prompt}`;

      const proxyUrl = '/api/llm/chat/completions';
      const model = import.meta.env.VITE_ALI_LLM_MODEL || 'qwen-turbo';

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'AI 响应错误');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

            const data = trimmedLine.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                accumulatedContent += content;
                setResult(accumulatedContent);
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
      }

      if (accumulatedContent) {
        try {
          await pb.collection('note_aigens').create({
            user: user.id,
            filter: filter || null,
            prompt: prompt,
            result: accumulatedContent,
            notes_count: notes.length
          });
        } catch (saveErr) {
          console.error('Failed to save AI generation record:', saveErr);
        }
      }
    } catch (err: any) {
      console.error('AI Generate Error:', err);
      toast.error('AI 生成失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPrompt('');
    setResult('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
            智能生成
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {!result ? (
            <>
              <div className="text-sm text-muted-foreground">
                基于当前筛选的 {notes.length} 条笔记（前 20 条）进行分析生成
              </div>
              <Textarea
                placeholder="输入你的请求，例如：总结这些笔记的主要内容、分析最近的学习趋势..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={loading}
              />
              {prompts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">选择预置提示词：</p>
                  <div className="flex flex-wrap gap-2">
                    {prompts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPrompt(p)}
                        className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-colors"
                        disabled={loading}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || loading}
                  className="gap-2"
                >
                  <SparklesIcon className="h-4 w-4" />
                  {loading ? '生成中...' : '生成'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_li]:marker:text-muted-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  }}
                >
                  {result}
                </ReactMarkdown>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result);
                    toast.success('已复制到剪贴板');
                  }}
                  className="gap-1"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  复制
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResult('')}
                >
                  重新生成
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
