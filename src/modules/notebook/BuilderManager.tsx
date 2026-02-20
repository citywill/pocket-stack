import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ShareIcon,
    DocumentTextIcon,
    TableCellsIcon
} from "@heroicons/react/24/outline";
import { pb } from '@/lib/pocketbase';
import { toast } from "sonner";

interface NotebookBuilder {
    id: string;
    title: string;
    prompt: string;
    type: 'mindmap' | 'text' | 'table';
}

const typeIconMap: Record<string, any> = {
    mindmap: ShareIcon,
    text: DocumentTextIcon,
    table: TableCellsIcon,
};

export default function BuilderManager() {
    const [builders, setBuilders] = useState<NotebookBuilder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBuilder, setEditingBuilder] = useState<Partial<NotebookBuilder> | null>(null);

    const fetchBuilders = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('notebook_builder').getFullList({
                sort: '-created',
                requestKey: null,
            });
            setBuilders(records as any);
        } catch (error) {
            console.error("获取生成器失败:", error);
            toast.error("获取数据失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuilders();
    }, []);

    const handleSave = async () => {
        if (!editingBuilder?.title || !editingBuilder?.prompt || !editingBuilder?.type) {
            toast.error("请填写完整信息");
            return;
        }

        try {
            if (editingBuilder.id) {
                await pb.collection('notebook_builder').update(editingBuilder.id, editingBuilder);
                toast.success("更新成功");
            } else {
                await pb.collection('notebook_builder').create(editingBuilder);
                toast.success("创建成功");
            }
            setIsDialogOpen(false);
            fetchBuilders();
        } catch (error) {
            console.error("保存失败:", error);
            toast.error("保存失败");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除这个生成器吗？")) return;
        try {
            await pb.collection('notebook_builder').delete(id);
            toast.success("删除成功");
            fetchBuilders();
        } catch (error) {
            console.error("删除失败:", error);
            toast.error("删除失败");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">生成器管理</h1>
                    <p className="text-slate-500 mt-1">配置作品生成器的提示词</p>
                </div>
                <Button onClick={() => {
                    setEditingBuilder({ title: '', prompt: '', type: 'text' });
                    setIsDialogOpen(true);
                }} className="rounded-xl gap-2 shadow-md">
                    <PlusIcon className="w-5 h-5" />
                    新增生成器
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {builders.map((builder) => (
                        <Card key={builder.id} className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group !p-0">
                            <CardContent className="p-0">
                                <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            {(() => {
                                                const Icon = typeIconMap[builder.type] || DocumentTextIcon;
                                                return <Icon className="w-5 h-5 text-blue-600" />;
                                            })()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{builder.title}</h3>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase font-medium">
                                                {builder.type === 'mindmap' ? '思维导图' : builder.type === 'table' ? '表格' : '文本报告'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                                setEditingBuilder(builder);
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(builder.id)}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <Label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">系统提示词 (Prompt)</Label>
                                    <div className="text-sm text-slate-600 line-clamp-4 bg-slate-50 rounded-xl p-3 border border-slate-100 min-h-[100px]">
                                        {builder.prompt || <span className="text-slate-300 italic">未设置提示词</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingBuilder?.id ? '编辑生成器' : '新增生成器'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>标题</Label>
                                <Input
                                    value={editingBuilder?.title || ''}
                                    onChange={e => setEditingBuilder(prev => ({ ...prev!, title: e.target.value }))}
                                    placeholder="输入生成器标题"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>类型</Label>
                                <Select
                                    value={editingBuilder?.type}
                                    onValueChange={v => setEditingBuilder(prev => ({ ...prev!, type: v as any }))}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="选择生成类型" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="mindmap">思维导图</SelectItem>
                                        <SelectItem value="text">文本报告</SelectItem>
                                        <SelectItem value="table">表格线索</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>系统提示词 (System Prompt)</Label>
                            <Textarea
                                value={editingBuilder?.prompt || ''}
                                onChange={e => setEditingBuilder(prev => ({ ...prev!, prompt: e.target.value }))}
                                placeholder="输入发给 AI 的指令..."
                                className="min-h-[200px] rounded-xl resize-none"
                            />
                            <p className="text-[10px] text-slate-400 italic">提示：提示词中应包含对生成格式（如 Mermaid、Markdown 表格等）的具体要求。</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">取消</Button>
                        <Button onClick={handleSave} className="rounded-xl px-8 shadow-md">保存配置</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
