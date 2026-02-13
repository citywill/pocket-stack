import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PaperAirplaneIcon, UserIcon, CpuChipIcon, TrashIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function AiChat() {
    const initialMessages: Message[] = [
        {
            id: '1',
            role: 'assistant',
            content: '你好！我是 AI 助手。有什么我可以帮你的吗？',
            timestamp: new Date(),
        },
    ];

    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isLoading]); // 增加 isLoading 触发滚动，流式回复时也能滚动

    // 监听 isLoading 变化，当加载结束时自动聚焦
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    const handleClear = () => {
        setMessages(initialMessages);
        toast.success('对话已清空');
        // 清空后也聚焦
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userContent = input.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userContent,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
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
                        { role: 'system', content: 'You are a helpful assistant.' },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userContent }
                    ],
                    stream: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'AI 响应错误');
            }

            // 初始化 AI 消息
            const aiMsgId = (Date.now() + 1).toString();
            const tempAiMsg: Message = {
                id: aiMsgId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, tempAiMsg]);

            // 处理流式响应
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
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === aiMsgId
                                            ? { ...msg, content: accumulatedContent }
                                            : msg
                                    )
                                );
                            }
                        } catch (e) {
                            console.error('Error parsing stream chunk:', e);
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error('LLM API Error:', err);
            toast.error('AI 调用失败: ' + (err.message || '未知错误'));
        } finally {
            setIsLoading(false);
            // 每次回复完成后，焦点回到输入框
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] flex-col space-y-4 p-6">
            <div className="flex flex-col">
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    AI 对话示例
                </h2>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    接入真实大模型接口，支持流式回复。
                </p>
            </div>

            <Card className="flex flex-1 flex-col overflow-hidden rounded-2xl border-none bg-white dark:bg-neutral-900 p-0">
                <CardHeader className="border-b bg-neutral-50/50 py-3 px-6 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <CpuChipIcon className="size-5 text-blue-500" />
                            AI 助手 (流式回复)
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            disabled={messages.length <= 1 || isLoading}
                            className="text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <TrashIcon className="size-4 mr-2" />
                            清空对话
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea ref={scrollRef} className="h-full">
                        <div className="p-6 space-y-6">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`flex max-w-[85%] items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        <Avatar className="size-9 border-2 border-white dark:border-neutral-800 shadow-sm">
                                            {msg.role === 'user' ? (
                                                <>
                                                    <AvatarFallback className="bg-blue-600 text-white">
                                                        <UserIcon className="size-5" />
                                                    </AvatarFallback>
                                                </>
                                            ) : (
                                                <>
                                                    <AvatarFallback className="bg-emerald-500 text-white">
                                                        <CpuChipIcon className="size-5" />
                                                    </AvatarFallback>
                                                </>
                                            )}
                                        </Avatar>
                                        <div
                                            className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                                                }`}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-code:text-blue-600 dark:prose-code:text-blue-400">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-9 border-2 border-white dark:border-neutral-800 shadow-sm">
                                            <AvatarFallback className="bg-emerald-500 text-white">
                                                <CpuChipIcon className="size-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex space-x-1.5 rounded-2xl bg-neutral-100 px-5 py-4 dark:bg-neutral-800">
                                            <div className="size-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]"></div>
                                            <div className="size-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]"></div>
                                            <div className="size-2 animate-bounce rounded-full bg-neutral-400"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="border-t bg-neutral-50/50 p-4 dark:bg-neutral-800/50">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex w-full items-center gap-3"
                    >
                        <Input
                            ref={inputRef}
                            placeholder="输入消息，探索 AI 的力量..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 rounded-xl border-neutral-200 bg-white px-4 py-6 focus-visible:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="h-12 w-12 rounded-xl bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
                        >
                            <PaperAirplaneIcon className="size-6" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
