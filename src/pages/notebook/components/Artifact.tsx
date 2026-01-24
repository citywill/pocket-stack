import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    MoreVerticalIcon,
    Delete02Icon,
    Copy01Icon,
    LegalDocument01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ScrollArea } from "@/components/ui/scroll-area";
import { pb } from '@/lib/pocketbase';
import Mermaid from '@/components/Mermaid';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { typeIconMap } from './ArtifactTypes';
import type { NotebookBuilder, ArtifactItem } from './ArtifactTypes';
import { ArtifactBuild } from './ArtifactBuild';

interface ArtifactProps {
    notebookId: string;
    activeNotes: Array<{
        title: string;
        content: string;
    }>;
    onArtifactUpdate?: () => void;
}

export const Artifact = ({
    notebookId,
    activeNotes,
    onArtifactUpdate
}: ArtifactProps) => {
    const [builders, setBuilders] = useState<NotebookBuilder[]>([]);
    const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);

    const fetchBuilders = useCallback(async () => {
        try {
            const records = await pb.collection('notebook_builder').getFullList<NotebookBuilder>({
                sort: 'created',
                requestKey: null
            });
            setBuilders(records);
        } catch (error) {
            console.error("获取生成器列表失败:", error);
        }
    }, []);

    const fetchArtifacts = useCallback(async () => {
        try {
            const records = await pb.collection('notebook_artifacts').getFullList<ArtifactItem>({
                filter: `notebook = "${notebookId}"`,
                sort: '-created',
                requestKey: null
            });
            setArtifacts(records);
        } catch (error) {
            console.error("获取作品列表失败:", error);
        }
    }, [notebookId]);

    useEffect(() => {
        fetchBuilders();
        fetchArtifacts();
    }, [fetchBuilders, fetchArtifacts]);

    const handleArtifactUpdate = (artifact: ArtifactItem, isFinal?: boolean, tempId?: string) => {
        setArtifacts(prev => {
            const exists = prev.find(a => a.id === artifact.id);
            if (exists) {
                // 如果是出错的情况（isFinal 为 true 且 isGenerating 为 false，且 ID 包含 temp）
                if (isFinal && !artifact.isGenerating && artifact.id.startsWith('temp')) {
                    return prev.filter(a => a.id !== artifact.id);
                }
                // 正常更新或替换临时项
                return prev.map(a => a.id === artifact.id ? artifact : a);
            }

            // 如果有 tempId，说明这是最终生成的正式记录，需要替换掉之前的临时记录
            if (isFinal && tempId) {
                return [artifact, ...prev.filter(a => a.id !== tempId)];
            }

            // 新增项（包括临时项）
            return [artifact, ...prev];
        });

        if (isFinal) {
            onArtifactUpdate?.();
        }
    };

    const handleDelete = async (artifactId: string) => {
        try {
            await pb.collection('notebook_artifacts').delete(artifactId, { requestKey: null });
            setArtifacts(prev => prev.filter(item => item.id !== artifactId));

            const notebook = await pb.collection('notebooks').getOne(notebookId, { requestKey: null });
            await pb.collection('notebooks').update(notebookId, {
                generated_count: Math.max(0, (notebook.generated_count || 0) - 1)
            }, { requestKey: null });

            onArtifactUpdate?.();
            toast.success("删除成功");
        } catch (error) {
            console.error("删除失败:", error);
            toast.error("删除失败");
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ArtifactBuild
                notebookId={notebookId}
                builders={builders}
                activeNotes={activeNotes}
                onArtifactUpdate={handleArtifactUpdate}
                onGenerationStateChange={setIsGenerating}
            />

            {/* 作品列表区 */}
            <div className="flex-1">
                <div className="p-4 space-y-2">
                    {artifacts.length === 0 && !isGenerating ? (
                        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-colors mt-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 mb-3 group-hover:text-blue-300 transition-colors">
                                <HugeiconsIcon icon={LegalDocument01Icon} className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-slate-400 group-hover:text-slate-500">暂无生成的作品</p>
                            <p className="text-xs text-slate-400/60 mt-1">点击上方生成器开始创作</p>
                        </div>
                    ) : (
                        artifacts.map((artifact) => (
                            <div
                                key={artifact.id}
                                className={`bg-white border border-slate-100 rounded-2xl p-4 transition-all relative group cursor-pointer hover:border-blue-200 hover:shadow-sm ${artifact.isGenerating ? 'animate-pulse' : ''}`}
                                onClick={() => !artifact.isGenerating && setSelectedArtifact(artifact)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 relative">
                                            {artifact.isGenerating ? (
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <HugeiconsIcon icon={typeIconMap[artifact.type] || LegalDocument01Icon} className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 text-sm mb-0.5 truncate">{artifact.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span className="bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md scale-90 origin-left">
                                                    {builders.find(b => b.id === artifact.builder)?.title || 'AI 生成器'}
                                                </span>
                                                <span className="truncate leading-relaxed">
                                                    {artifact.isGenerating ? (
                                                        '正在生成内容...'
                                                    ) : (
                                                        new Date(artifact.created).toLocaleString('zh-CN', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {!artifact.isGenerating && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <HugeiconsIcon icon={MoreVerticalIcon} className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem
                                                        className="gap-2 text-slate-600 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(artifact.content);
                                                            toast.success("已复制到剪贴板");
                                                        }}
                                                    >
                                                        <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                                                        复制内容
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 text-red-600 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(artifact.id);
                                                        }}
                                                    >
                                                        <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                                        删除作品
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 作品详情全屏弹窗 */}
            <Dialog open={!!selectedArtifact} onOpenChange={(open) => !open && setSelectedArtifact(null)}>
                <DialogContent className="!max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="p-6 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <HugeiconsIcon
                                    icon={selectedArtifact ? (typeIconMap[selectedArtifact.type] || LegalDocument01Icon) : LegalDocument01Icon}
                                    className="w-6 h-6"
                                />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <DialogTitle className="text-xl font-bold text-slate-900 mb-1 truncate">
                                    {selectedArtifact?.title}
                                </DialogTitle>
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-lg font-medium">
                                        {builders.find(b => b.id === selectedArtifact?.builder)?.title || 'AI 生成器'}
                                    </span>
                                    <span>
                                        {selectedArtifact?.created && new Date(selectedArtifact.created).toLocaleString('zh-CN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pr-8">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-xl border-slate-200"
                                    onClick={() => {
                                        if (selectedArtifact) {
                                            navigator.clipboard.writeText(selectedArtifact.content);
                                            toast.success("已复制到剪贴板");
                                        }
                                    }}
                                >
                                    <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                                    复制内容
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-8">
                        <div className="">
                            <div className="prose prose-slate prose-blue max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        table({ children }) {
                                            return (
                                                <div className="my-6 w-full overflow-x-auto">
                                                    <table className="w-full border-collapse border border-slate-200">
                                                        {children}
                                                    </table>
                                                </div>
                                            );
                                        },
                                        thead({ children }) {
                                            return <thead className="bg-slate-50">{children}</thead>;
                                        },
                                        th({ children }) {
                                            return (
                                                <th className="border border-slate-200 p-3 text-left font-semibold text-slate-700">
                                                    {children}
                                                </th>
                                            );
                                        },
                                        td({ children }) {
                                            return (
                                                <td className="border border-slate-200 p-3 text-slate-600">
                                                    {children}
                                                </td>
                                            );
                                        },
                                        tr({ children }) {
                                            return <tr className="even:bg-slate-50/50">{children}</tr>;
                                        },
                                        code({ node, inline, className, children, ...props }: any) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const language = match ? match[1] : '';

                                            if (!inline && language === 'mermaid') {
                                                return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                            }

                                            return (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {selectedArtifact?.content || ''}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};
