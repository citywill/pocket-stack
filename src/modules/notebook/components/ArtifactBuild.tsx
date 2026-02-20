import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    ShareIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { toast } from 'sonner';
import { pb } from '@/lib/pocketbase';
import { typeIconMap } from './ArtifactTypes';
import type { NotebookBuilder, ArtifactItem } from './ArtifactTypes';

interface ArtifactBuildProps {
    notebookId: string;
    builders: NotebookBuilder[];
    activeNotes: Array<{
        title: string;
        content: string;
    }>;
    onArtifactUpdate: (artifact: ArtifactItem, isFinal?: boolean, tempId?: string) => void;
    onGenerationStateChange: (isGenerating: boolean) => void;
}

export const ArtifactBuild: React.FC<ArtifactBuildProps> = ({
    notebookId,
    builders,
    activeNotes,
    onArtifactUpdate,
    onGenerationStateChange
}) => {
    const [generatingBuilderId, setGeneratingBuilderId] = useState<string | null>(null);

    // 移除内部 fetchBuilders

    const handleGenerate = async (builder: NotebookBuilder) => {
        if (generatingBuilderId) return;

        if (activeNotes.length === 0) {
            toast.error("请先在左侧勾选需要参与研判的笔记");
            return;
        }

        const tempId = 'temp-' + Date.now();
        try {
            setGeneratingBuilderId(builder.id);
            onGenerationStateChange(true);

            // 初始 loading 项目
            const initialArtifact: ArtifactItem = {
                id: tempId,
                title: builder.title,
                type: builder.type,
                content: "",
                notebook: notebookId,
                builder: builder.id,
                created: new Date().toISOString(),
                isGenerating: true
            };
            onArtifactUpdate(initialArtifact);

            const contextString = activeNotes.map(n => `--- 笔记标题：${n.title} ---\n${n.content}`).join('\n\n');
            const systemPrompt = `${builder.prompt}\n\n以下是参考笔记内容：\n${contextString}`;

            const proxyUrl = '/api/llm/chat/completions';
            const model = import.meta.env.VITE_ALI_LLM_MODEL || 'qwen-turbo';

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        {
                            role: 'user', content: `请根据提供的参考笔记，生成一份${builder.title}。请务必包含一个简洁的标题。
格式要求：
第一行必须是：# [标题内容]
从第二行开始是正文内容。` }
                    ],
                    stream: true
                })
            });

            if (!response.ok) throw new Error("AI 响应错误");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let aiContent = "";
            let generatedTitle = builder.title;

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
                                aiContent += content;

                                // 解析标题和内容
                                let displayTitle = generatedTitle;
                                let displayContent = aiContent;

                                if (aiContent.startsWith('# ')) {
                                    const firstNewLineIndex = aiContent.indexOf('\n');
                                    if (firstNewLineIndex !== -1) {
                                        displayTitle = aiContent.slice(2, firstNewLineIndex).trim();
                                        displayContent = aiContent.slice(firstNewLineIndex + 1).trim();
                                        generatedTitle = displayTitle;
                                    } else {
                                        displayTitle = aiContent.slice(2).trim() || builder.title;
                                        displayContent = "";
                                    }
                                }

                                onArtifactUpdate({
                                    ...initialArtifact,
                                    title: displayTitle,
                                    content: displayContent
                                });
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }

            // 保存到数据库
            const authData = pb.authStore.model;
            if (!authData) throw new Error("未登录");

            let finalTitle = generatedTitle;
            let finalContent = aiContent;
            if (aiContent.startsWith('# ')) {
                const firstNewLineIndex = aiContent.indexOf('\n');
                if (firstNewLineIndex !== -1) {
                    finalTitle = aiContent.slice(2, firstNewLineIndex).trim();
                    finalContent = aiContent.slice(firstNewLineIndex + 1).trim();
                } else {
                    finalTitle = aiContent.slice(2).trim() || builder.title;
                    finalContent = "";
                }
            }

            const record = await pb.collection('notebook_artifacts').create({
                title: finalTitle,
                type: builder.type,
                notebook: notebookId,
                builder: builder.id,
                content: finalContent,
                creator: authData.id
            }, { requestKey: null });

            // 更新笔记本的作品计数
            const notebook = await pb.collection('notebooks').getOne(notebookId, { requestKey: null });
            await pb.collection('notebooks').update(notebookId, {
                generated_count: (notebook.generated_count || 0) + 1
            }, { requestKey: null });

            onArtifactUpdate({ ...record as unknown as ArtifactItem, isGenerating: false }, true, tempId);
            toast.success("生成作品成功");

        } catch (error) {
            console.error("生成失败:", error);
            toast.error("生成失败，请稍后重试");
            // 通知父组件移除临时项目 (通过发送一个特殊的信号或由父组件处理)
            onArtifactUpdate({ id: tempId, isGenerating: false } as ArtifactItem, true);
        } finally {
            setGeneratingBuilderId(null);
            onGenerationStateChange(false);
        }
    };

    return (
        <div className="p-4 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-3">
                {builders.map((builder) => {
                    const Icon = typeIconMap[builder.type] || ShareIcon;
                    return (
                        <Button
                            key={builder.id}
                            variant="outline"
                            className={`flex flex-row items-center justify-center rounded-2xl border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/30 group transition-all p-6 gap-2 ${generatingBuilderId === builder.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => handleGenerate(builder)}
                            disabled={!!generatingBuilderId}
                        >
                            <div className="relative w-5 h-5">
                                {generatingBuilderId === builder.id ? (
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Icon className="w-5 h-5 text-slate-400 group-hover:opacity-0 transition-opacity absolute inset-0" />
                                        <PlusIcon className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0" />
                                    </>
                                )}
                            </div>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 truncate px-1">
                                {builder.title}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};
