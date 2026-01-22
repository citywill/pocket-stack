import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    AiChat02Icon,
    Delete02Icon,
    ArtificialIntelligence01Icon,
    Copy01Icon,
    Note01Icon,
    CheckListIcon,
    Settings02Icon
} from "@hugeicons/core-free-icons";
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Message {
    id: string;
    role: 'ai' | 'user';
    content: string;
}

interface AiChatContainerProps {
    notebookId: string;
    notebookTitle: string;
    chatCount: number;
    onChatUpdate?: () => void;
    onNoteCreated?: () => void;
}

export const AiChatContainer: React.FC<AiChatContainerProps> = ({
    notebookId,
    notebookTitle,
    chatCount,
    onChatUpdate,
    onNoteCreated
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [copyingId, setCopyingId] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyingId(id);
            toast.success("已复制到剪贴板");
            setTimeout(() => setCopyingId(null), 2000);
        } catch (err) {
            toast.error("复制失败");
        }
    };

    const handleConvertToNote = async (content: string) => {
        try {
            const authData = pb.authStore.model;
            if (!authData) {
                toast.error("用户未登录");
                return;
            }

            // 提取标题（取第一行或前15个字）
            const firstLine = content.split('\n')[0].replace(/[#*`]/g, '').trim();
            const title = firstLine.length > 0 ? (firstLine.length > 15 ? firstLine.slice(0, 15) + '...' : firstLine) : 'AI 研判建议';

            await pb.collection('notebook_notes').create({
                notebook_id: notebookId,
                user_id: authData.id,
                title: title,
                content: content,
                type: 'AI研判',
                is_active: true,
                is_pinned: false
            });

            // 更新笔记本的笔记总数
            const notebook = await pb.collection('notebooks').getOne(notebookId, {
                requestKey: null
            });
            await pb.collection('notebooks').update(notebookId, {
                note_count: (notebook.note_count || 0) + 1
            }, {
                requestKey: null
            });

            toast.success("已成功转为笔记");
            onNoteCreated?.();
        } catch (error) {
            console.error("转为笔记失败:", error);
            toast.error("操作失败，请重试");
        }
    };

    // 自动滚动到底部
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // 获取历史对话和提示词
    const fetchInitialData = async () => {
        try {
            // 获取提示词
            const notebook = await pb.collection('notebooks').getOne(notebookId, {
                requestKey: null
            });
            setCustomPrompt(notebook.chat_prompt || '');

            // 获取对话
            const records = await pb.collection('notebook_chats').getFullList({
                filter: `notebook_id = "${notebookId}"`,
                sort: 'created',
                requestKey: null,
            });

            const history: Message[] = records.map(record => ({
                id: record.id,
                role: record.role as 'ai' | 'user',
                content: record.content
            }));

            // 如果没有历史记录，添加欢迎语
            if (history.length === 0) {
                setMessages([
                    {
                        id: 'welcome',
                        role: 'ai',
                        content: `您好！我是您的智能研判助手。关于《${notebookTitle}》，您可以询问我任何相关问题，或者让我为您分析现有的笔记。`
                    }
                ]);
            } else {
                setMessages(history);
            }
        } catch (error) {
            console.error("获取初始数据失败:", error);
        }
    };

    useEffect(() => {
        if (notebookId) {
            fetchInitialData();
        }
    }, [notebookId]);

    const handleSavePrompt = async () => {
        try {
            await pb.collection('notebooks').update(notebookId, {
                chat_prompt: customPrompt
            }, {
                requestKey: null
            });
            toast.success("系统提示词已更新");
            setIsPromptDialogOpen(false);
        } catch (error) {
            console.error("更新提示词失败:", error);
            toast.error("更新提示词失败");
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || loading) return;

        const userContent = inputValue.trim();
        setInputValue('');
        setLoading(true);

        try {
            const authData = pb.authStore.model;
            if (!authData) {
                toast.error("用户未登录");
                return;
            }

            // 1. 保存用户消息到数据库
            const userRecord = await pb.collection('notebook_chats').create({
                notebook_id: notebookId,
                role: 'user',
                content: userContent,
                user_id: authData.id
            });

            setMessages(prev => [...prev, {
                id: userRecord.id,
                role: 'user',
                content: userContent
            }]);

            // 2. 获取实时激活的笔记作为上下文
            const activeNotesRecords = await pb.collection('notebook_notes').getFullList({
                filter: `notebook_id = "${notebookId}" && is_active = true`,
                sort: 'created',
                requestKey: null
            });

            // 3. 调用真实大模型 API
            const proxyUrl = '/api/llm/chat/completions';
            const model = import.meta.env.VITE_ALI_LLM_MODEL || 'qwen-turbo';

            // 构建上下文信息
            const contextString = activeNotesRecords.length > 0
                ? `\n\n当前笔记本中已激活的参考笔记内容如下：\n${activeNotesRecords.map(n => `--- 笔记标题：${n.title} ---\n${n.content}`).join('\n\n')}`
                : '';

            const defaultPrompt = `当前正在处理研判笔记本《${notebookTitle}》。请根据用户的问题以及下面提供的参考笔记内容（如果提供的话）进行专业、准确的分析建议。`;
            const systemPrompt = `${customPrompt || defaultPrompt}${contextString}`;
            console.log("AI 对话系统提示词 (System Prompt):", systemPrompt);

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        ...messages
                            .filter(m => m.id !== 'welcome')
                            .map(m => ({
                                role: m.role === 'ai' ? 'assistant' : 'user',
                                content: m.content
                            })),
                        { role: 'user', content: userContent }
                    ],
                    stream: true
                })
            });

            if (!response.ok) {
                let errorMessage = 'AI 响应错误';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.message || `请求失败 (${response.status})`;
                } catch (e) {
                    errorMessage = `服务器错误 (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            // 3. 处理流式响应
            let aiContent = '';
            const tempMsgId = 'temp-ai-' + Date.now();
            setMessages(prev => [...prev, {
                id: tempMsgId,
                role: 'ai',
                content: ''
            }]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

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
                                const currentContent = aiContent;
                                setMessages(prev => {
                                    const lastMsg = prev[prev.length - 1];
                                    if (lastMsg && lastMsg.id === tempMsgId) {
                                        return [...prev.slice(0, -1), { ...lastMsg, content: currentContent }];
                                    }
                                    return prev;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing stream chunk:', e);
                        }
                    }
                }
            }

            // 4. 保存 AI 回复到数据库
            const aiRecord = await pb.collection('notebook_chats').create({
                notebook_id: notebookId,
                role: 'ai',
                content: aiContent,
                user_id: authData.id
            }, {
                requestKey: null
            });

            // 替换临时消息为数据库记录
            setMessages(prev => prev.map(msg =>
                msg.id === tempMsgId
                    ? { id: aiRecord.id, role: 'ai', content: aiContent }
                    : msg
            ));

            // 5. 更新笔记本的对话数 (同步增加2条记录)
            await pb.collection('notebooks').update(notebookId, {
                'chat_count+': 2
            }, {
                requestKey: null
            });

            // 通知父组件更新对话数
            onChatUpdate?.();

        } catch (error) {
            console.error("发送消息失败:", error);
            toast.error("发送消息失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        try {
            const records = await pb.collection('notebook_chats').getFullList({
                filter: `notebook_id = "${notebookId}"`,
                fields: 'id'
            });

            await Promise.all(records.map(record =>
                pb.collection('notebook_chats').delete(record.id)
            ));

            // 更新笔记本的对话数为 0
            await pb.collection('notebooks').update(notebookId, {
                chat_count: 0
            });

            setMessages([
                {
                    id: 'welcome',
                    role: 'ai',
                    content: `您好！我是您的智能研判助手。关于《${notebookTitle}》，您可以询问我任何相关问题，或者让我为您分析现有的笔记。`
                }
            ]);

            onChatUpdate?.();
            toast.success("对话记录已清空");
        } catch (error) {
            console.error("清空对话失败:", error);
            toast.error("清空对话失败");
        }
    };

    return (
        <section className="flex-[1.2] flex flex-col min-w-[400px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2 text-slate-600">
                    <HugeiconsIcon icon={AiChat02Icon} className="w-5 h-5" />
                    <h2 className="font-bold">对话记录 ({chatCount})</h2>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                        onClick={() => setIsPromptDialogOpen(true)}
                        title="设置系统提示词"
                    >
                        <HugeiconsIcon icon={Settings02Icon} className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                        onClick={handleClear}
                        title="清空对话记录"
                    >
                        <HugeiconsIcon icon={Delete02Icon} className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>设置 AI 系统提示词</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-slate-500 mb-2">
                            自定义 AI 的回复风格和背景知识。留空则使用默认提示词。
                        </p>
                        <Textarea
                            placeholder="例如：你是一个严谨的法律顾问，擅长从证据中发现漏洞..."
                            className="min-h-[200px] text-sm"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSavePrompt}>保存设置</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/20"
            >
                <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                {msg.role === 'ai' ? (
                                    <HugeiconsIcon icon={ArtificialIntelligence01Icon} className="w-5 h-5 text-white" />
                                ) : (
                                    <span className="text-xs font-bold text-slate-600">我</span>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className={`p-3 rounded-2xl shadow-sm text-sm ${msg.role === 'ai'
                                    ? 'bg-white rounded-tl-none border border-slate-100 text-slate-700 prose prose-slate prose-sm max-w-none'
                                    : 'bg-blue-600 rounded-tr-none text-white'
                                    }`}>
                                    {msg.role === 'ai' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {msg.role === 'ai' && msg.id !== 'welcome' && (
                                    <div className="flex items-center gap-2 mt-2 ml-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg gap-1.5"
                                            onClick={() => handleCopy(msg.content, msg.id)}
                                        >
                                            <HugeiconsIcon
                                                icon={copyingId === msg.id ? CheckListIcon : Copy01Icon}
                                                size={14}
                                            />
                                            <span className="text-xs">{copyingId === msg.id ? '已复制' : '复制'}</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg gap-1.5"
                                            onClick={() => handleConvertToNote(msg.content)}
                                        >
                                            <HugeiconsIcon icon={Note01Icon} size={14} />
                                            <span className="text-xs">转为笔记</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-600 animate-pulse">
                                <HugeiconsIcon icon={ArtificialIntelligence01Icon} className="w-5 h-5 text-white" />
                            </div>
                            <div className="p-3 rounded-2xl shadow-sm text-sm bg-white rounded-tl-none border border-slate-100 text-slate-400 italic">
                                正在思考...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t bg-white shrink-0">
                <form
                    className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-blue-400 transition-colors"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <input
                        type="text"
                        placeholder="输入您的问题..."
                        className="flex-1 bg-transparent border-none outline-none text-sm py-1"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 rounded-lg h-8 px-4"
                        disabled={loading || !inputValue.trim()}
                    >
                        发送
                    </Button>
                </form>
            </div>
        </section >
    );
};
