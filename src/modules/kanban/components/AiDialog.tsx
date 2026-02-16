import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SparklesIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { KanbanLog } from '../types';

interface SummaryDialogProps {
    logs: KanbanLog[];
    date?: Date;
    title?: string;
}

export function AiDialog({ logs, date, title }: SummaryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [userRequirement, setUserRequirement] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateContent = async () => {
        if (logs.length === 0) {
            toast.error('没有日志可供生成');
            return;
        }

        setIsLoading(true);
        setSummary('');

        try {
            // 准备 Prompt
            const logContent = logs.map(log =>
                `- [${log.expand?.task?.title || '未知任务'}] ${log.content}${log.remark ? ` (备注: ${log.remark})` : ''}`
            ).join('\n');

            const systemPrompt = `你是一个智能助手。请根据用户提供的任务日志，按照用户的要求生成相应的内容。
你可以进行工作总结、周报生成、进度汇报或者回答用户关于这些日志的问题。
如果用户没有具体要求，默认生成一份简洁的工作总结。`;

            const displayTitle = title || (date ? date.toLocaleDateString() : '任务日志');
            const userPrompt = `参考资料（${displayTitle}）：
${logContent}

用户指令：${userRequirement || '请根据上述日志生成一份工作总结。'}`;

            // 3. 调用 AI
            const proxyUrl = '/api/llm/chat/completions';
            const model = (import.meta as any).env.VITE_ALI_LLM_MODEL || 'qwen-turbo';

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    stream: true
                })
            });

            if (!response.ok) throw new Error('AI 响应错误');

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
                                setSummary(accumulatedContent);
                            }
                        } catch (e) {
                            console.error('Error parsing stream chunk:', e);
                        }
                    }
                }
            }
        } catch (error: any) {
            toast.error('生成总结失败: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 rounded-xl">
                    <SparklesIcon className="size-4" />
                    智能生成
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <SparklesIcon className="size-6 text-blue-500" />
                        AI 智能生成
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 用户要求 */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">自定义生成要求</Label>
                        <Textarea
                            placeholder="请根据任务日志提供总结"
                            value={userRequirement}
                            onChange={(e) => setUserRequirement(e.target.value)}
                            className="min-h-[100px] rounded-2xl resize-none focus-visible:ring-blue-500 border-neutral-200 dark:border-neutral-800"
                        />
                    </div>

                    {/* 总结结果 */}
                    {summary && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">生成结果</Label>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-3 text-blue-600 gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                                    onClick={() => {
                                        navigator.clipboard.writeText(summary);
                                        toast.success('已复制到剪贴板');
                                    }}
                                >
                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium">复制</span>
                                </Button>
                            </div>
                            <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/30 min-h-[120px]">
                                <ScrollArea className="max-h-[300px] pr-4">
                                    <div className="prose prose-sm prose-blue dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {summary}
                                        </ReactMarkdown>
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 pt-4 border-t bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                        AI 生成内容仅供参考
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl px-5">
                            取消
                        </Button>
                        <Button
                            onClick={generateContent}
                            disabled={isLoading || logs.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-medium shadow-sm transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    正在生成...
                                </>
                            ) : (
                                "开始生成"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
