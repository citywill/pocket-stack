import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { ArrowLeftIcon, ClipboardDocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIGenRecord {
    id: string;
    user: string;
    filter: {
        activeFilter: string;
        activeFrom?: string | null;
        activeTo?: string | null;
        activeTag?: string | null;
    } | null;
    prompt: string;
    result: string;
    notes_count: number;
    created: string;
    updated: string;
}

export default function AIGens() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState<AIGenRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AIGenRecord | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchRecords();
        }
    }, [user?.id]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const result = await pb.collection('note_aigens').getList<AIGenRecord>(1, 50, {
                filter: `user = "${user?.id}"`,
                sort: '-created',
                requestKey: null,
            });
            setRecords(result.items);
        } catch (error) {
            console.error('Failed to fetch AI generation records:', error);
            toast.error('获取记录失败');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await pb.collection('note_aigens').delete(id);
            toast.success('删除成功');
            fetchRecords();
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const getFilterDescription = (filter: AIGenRecord['filter']) => {
        if (!filter) return '全部';
        if (filter.activeFilter === 'trash') return '回收站';
        if (filter.activeTag) return `标签筛选`;
        if (filter.activeFrom) return `${filter.activeFrom} 至 ${filter.activeTo || filter.activeFrom}`;
        return '全部';
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeftIcon className="size-5 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">智能生成记录</h1>
                        <p className="text-muted-foreground mt-1">浏览历史智能生成记录</p>
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <div className="divide-y">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            加载中...
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            暂无记录
                        </div>
                    ) : (
                        records.map((record) => (
                            <div
                                key={record.id}
                                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                onClick={() => setSelectedRecord(record)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                            <span>{new Date(record.created).toLocaleString()}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>{record.notes_count} 条笔记</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-blue-600">{getFilterDescription(record.filter)}</span>
                                        </div>
                                        <p className="text-sm font-medium truncate">{record.prompt}</p>
                                        <p className="text-sm text-muted-foreground truncate mt-1">
                                            {record.result.substring(0, 100)}...
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(record.id);
                                        }}
                                    >
                                        <TrashIcon className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>智能生成详情</DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="flex-1 overflow-y-auto space-y-4 py-4">
                            <div className="text-sm text-muted-foreground">
                                <span>{new Date(selectedRecord.created).toLocaleString()}</span>
                                <span className="mx-2">|</span>
                                <span>{selectedRecord.notes_count} 条笔记</span>
                                <span className="mx-2">|</span>
                                <span className="text-blue-600">{getFilterDescription(selectedRecord.filter)}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700">用户请求：</p>
                                <p className="text-sm mt-1">{selectedRecord.prompt}</p>
                            </div>
                            <div className="prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_li]:marker:text-muted-foreground">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                    }}
                                >
                                    {selectedRecord.result}
                                </ReactMarkdown>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(selectedRecord.result);
                                        toast.success('已复制到剪贴板');
                                    }}
                                    className="gap-1"
                                >
                                    <ClipboardDocumentIcon className="h-4 w-4" />
                                    复制结果
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
