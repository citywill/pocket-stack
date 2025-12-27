import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    SentIcon,
    AiChat02Icon,
    DatabaseIcon,
    RobotIcon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { dataAssistant } from './components/DataAssistant';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created: string;
    isQuery?: boolean;
}

export default function AiAssistant() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [systemPrompt, setSystemPrompt] = useState<string>('');

    useEffect(() => {
        // Initialize system prompt with schemas
        dataAssistant.buildSystemPrompt().then(setSystemPrompt);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const callAI = async (chatMessages: ChatMessage[]) => {
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
                    ...chatMessages.map(m => ({ role: m.role, content: m.content })),
                ],
                stream: true
            })
        });

        if (!response.ok) throw new Error('AI 响应错误');
        return response;
    };

    const processStream = async (response: Response, tempMsgId: string, onFinish: (content: string) => void) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let aiContent = '';

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                    const data = trimmedLine.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            aiContent += content;
                            setMessages(prev => {
                                const lastMsg = prev[prev.length - 1];
                                if (lastMsg && lastMsg.id === tempMsgId) {
                                    return [...prev.slice(0, -1), { ...lastMsg, content: aiContent }];
                                }
                                return prev;
                            });
                        }
                    } catch (e) {
                        // ignore parse errors for partial chunks
                    }
                }
            }
        }
        onFinish(aiContent);
        return aiContent;
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userContent = input.trim();
        setInput('');
        setIsLoading(true);

        const newUserMsg: ChatMessage = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: userContent,
            created: new Date().toISOString(),
        };

        let currentMessages = [...messages, newUserMsg];
        setMessages(currentMessages);

        try {
            let turn = 0;
            const maxTurns = 3; // Prevent infinite loops

            while (turn < maxTurns) {
                turn++;
                const response = await callAI(currentMessages);

                const tempAiId = 'ai-' + Date.now();
                const tempAiMsg: ChatMessage = {
                    id: tempAiId,
                    role: 'assistant',
                    content: '',
                    created: new Date().toISOString()
                };
                setMessages(prev => [...prev, tempAiMsg]);

                let finalContent = '';
                await processStream(response, tempAiId, (content) => {
                    finalContent = content;
                });

                // Check if there is a query command
                const queryMatch = finalContent.match(/\[QUERY:\s*(\{.*?\})\]/);
                if (queryMatch) {
                    try {
                        const queryConfig = JSON.parse(queryMatch[1]);
                        const results = await dataAssistant.queryData(queryConfig.collection, queryConfig);

                        const observationMsg: ChatMessage = {
                            id: 'obs-' + Date.now(),
                            role: 'system',
                            content: `Observation from ${queryConfig.collection}: ${JSON.stringify(results, null, 2)}`,
                            created: new Date().toISOString()
                        };

                        // Add assistant msg and observation msg to history
                        currentMessages = [...currentMessages, { ...tempAiMsg, content: finalContent }, observationMsg];
                        // Don't update UI with observation yet, or maybe show it as a small badge?
                        // For now, we just continue the loop
                        continue;
                    } catch (e) {
                        const errorMsg: ChatMessage = {
                            id: 'err-' + Date.now(),
                            role: 'system',
                            content: `Error executing query: ${e instanceof Error ? e.message : String(e)}`,
                            created: new Date().toISOString()
                        };
                        currentMessages = [...currentMessages, { ...tempAiMsg, content: finalContent }, errorMsg];
                        continue;
                    }
                } else {
                    // No query, finished
                    break;
                }
            }
        } catch (err) {
            console.error('LLM API Error:', err);
            toast.error('大模型调用失败');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <HugeiconsIcon icon={DatabaseIcon} className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">AI 数据助手</h2>
                        <p className="text-xs text-neutral-500">基于 PocketBase 数据的智能问答</p>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-6 py-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                <HugeiconsIcon icon={AiChat02Icon} className="h-12 w-12 text-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">你好，我是你的 AI 数据助手</h3>
                                <p className="text-neutral-500 max-w-sm">
                                    你可以问我关于系统中的数据问题，例如：<br />
                                    "目前有多少个任务？"<br />
                                    "列出所有进行中的项目"<br />
                                    "查找最近添加的客户"
                                </p>
                            </div>
                        </div>
                    )}
                    {messages
                        .filter(m => m.role !== 'system')
                        .map((message) => {
                            // Hide query commands from user view
                            const displayContent = message.content.replace(/\[QUERY:\s*\{.*?\}\]/g, '').trim();
                            if (message.role === 'assistant' && !displayContent && message.content.includes('[QUERY:')) {
                                return (
                                    <div key={message.id} className="flex gap-4 flex-row">
                                        <Avatar className="h-10 w-10 border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                                            <AvatarFallback className="bg-blue-100 text-blue-600">
                                                <HugeiconsIcon icon={RobotIcon} className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start gap-2">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                                                <HugeiconsIcon icon={DatabaseIcon} className="h-4 w-4 animate-spin" />
                                                正在查询数据库...
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (!displayContent && message.role === 'assistant') return null;

                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-4",
                                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <Avatar className={cn(
                                        "h-10 w-10 border",
                                        message.role === 'user' ? "bg-blue-600 border-blue-500" : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                    )}>
                                        {message.role === 'user' ? (
                                            <AvatarFallback className="text-white">我</AvatarFallback>
                                        ) : (
                                            <>
                                                <AvatarImage src="/favicon.svg" />
                                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                                    <HugeiconsIcon icon={RobotIcon} className="h-5 w-5" />
                                                </AvatarFallback>
                                            </>
                                        )}
                                    </Avatar>
                                    <div className={cn(
                                        "flex flex-col max-w-[80%] gap-2",
                                        message.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            message.role === 'user'
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-tl-none"
                                        )}>
                                            <div className="prose dark:prose-invert max-w-none prose-sm">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {displayContent}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-neutral-400 px-1">
                                            {format(new Date(message.created), 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    {isLoading && (
                        <div className="flex gap-4">
                            <Avatar className="h-10 w-10 border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                    <HugeiconsIcon icon={RobotIcon} className="h-5 w-5 animate-pulse" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl rounded-tl-none shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <Input
                        placeholder="问问我关于数据的问题..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:ring-blue-500"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    >
                        <HugeiconsIcon icon={SentIcon} className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-[10px] text-center text-neutral-400 mt-3">
                    AI 数据助手可以访问您的 PocketBase 集合并回答相关问题。
                </p>
            </div>
        </div>
    );
}
