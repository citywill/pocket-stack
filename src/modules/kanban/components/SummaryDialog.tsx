import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { KanbanLog, KanbanTag } from '../types';

interface SummaryDialogProps {
    logs: KanbanLog[];
    allTags: KanbanTag[];
    date: Date;
}

export function SummaryDialog({ logs, allTags, date }: SummaryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [userRequirement, setUserRequirement] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleTag = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const generateSummary = async () => {
        if (logs.length === 0) {
            toast.error('当天没有日志可供总结');
            return;
        }

        setIsLoading(true);
        setSummary('');

        try {
            // 1. 过滤日志
            const filteredLogs = logs.filter(log => {
                if (selectedTagIds.length === 0) return true;
                const taskTags = log.expand?.task?.tags || [];
                return selectedTagIds.some(id => taskTags.includes(id));
            });

            if (filteredLogs.length === 0) {
                toast.error('按当前标签筛选后没有日志');
                setIsLoading(false);
                return;
            }

            // 2. 准备 Prompt
            const logContent = filteredLogs.map(log => 
                `- [${log.expand?.task?.title || '未知任务'}] ${log.content}${log.remark ? ` (备注: ${log.remark})` : ''}`
            ).join('\n');

            const systemPrompt = `你是一个高效的任务总结助手。请根据用户提供的任务日志，撰写一份简洁明了的日报总结。
如果是多项任务，请分条列出进展。
如果用户有特殊要求，请务必优先满足。`;

            const userPrompt = `日期：${date.toLocaleDateString()}
任务日志：
${logContent}

用户特殊要求：${userRequirement || '请总结今日工作进展和成果。'}`;

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
                    智能总结
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <SparklesIcon className="size-6 text-blue-500" />
                        AI 智能总结
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 标签筛选 */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">按标签筛选日志 (可选)</Label>
                        <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => (
                                <Badge
                                    key={tag.id}
                                    variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                                    className={`cursor-pointer px-3 py-1.5 rounded-full transition-all text-xs font-medium ${
                                        selectedTagIds.includes(tag.id) 
                                            ? "bg-blue-500 hover:bg-blue-600 border-transparent text-white" 
                                            : "hover:bg-blue-50 text-neutral-600 border-neutral-200 dark:border-neutral-700"
                                    }`}
                                    onClick={() => toggleTag(tag.id)}
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                            {allTags.length === 0 && <p className="text-xs text-muted-foreground italic">暂无可用标签</p>}
                        </div>
                    </div>

                    {/* 用户要求 */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">自定义总结要求</Label>
                        <Textarea
                            placeholder="例如：请重点突出项目的技术难点，或者用更口语化的方式总结..."
                            value={userRequirement}
                            onChange={(e) => setUserRequirement(e.target.value)}
                            className="min-h-[100px] rounded-2xl resize-none focus-visible:ring-blue-500 border-neutral-200 dark:border-neutral-800"
                        />
                    </div>

                    {/* 总结结果 */}
                    {summary && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">生成结果</Label>
                            <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/30 min-h-[120px] relative group">
                                <ScrollArea className="max-h-[300px] pr-4">
                                    <div className="prose prose-sm prose-blue dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {summary}
                                        </ReactMarkdown>
                                    </div>
                                </ScrollArea>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                    onClick={() => {
                                        navigator.clipboard.writeText(summary);
                                        toast.success('已复制到剪贴板');
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                    </svg>
                                </Button>
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
                            onClick={generateSummary}
                            disabled={isLoading || logs.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-medium shadow-sm transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    正在生成...
                                </>
                            ) : (
                                "生成总结"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
