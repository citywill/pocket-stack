import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    MagnifyingGlassIcon,
    BookOpenIcon,
    PlusIcon,
    ChatBubbleLeftRightIcon,
    CalendarIcon,
    ArrowsUpDownIcon,
    SparklesIcon,
    PencilSquareIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { pb } from '@/lib/pocketbase';
import type { NotebookEntry } from './mocks/notebookMocks';
import { ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';

export default function NotebookList() {
    const navigate = useNavigate();
    const [notebooks, setNotebooks] = useState<NotebookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newNotebookTitle, setNewNotebookTitle] = useState("");

    // 编辑相关状态
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingNotebook, setEditingNotebook] = useState<NotebookEntry | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const itemsPerPage = 6;

    // 获取笔记本列表
    const fetchNotebooks = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('notebooks').getFullList({
                sort: '-created',
                requestKey: null, // 禁用自动取消
            });

            const mappedNotebooks: NotebookEntry[] = records.map(record => ({
                id: record.id,
                title: record.title,
                date: record.created.replace('T', ' ').slice(0, 16),
                note_count: record.note_count || 0,
                generated_count: record.generated_count || 0,
                chat_count: record.chat_count || 0,
                summary: record.summary || "",
            }));

            setNotebooks(mappedNotebooks);
        } catch (error) {
            if (error instanceof ClientResponseError && error.isAbort) {
                return;
            }
            console.error("获取笔记本列表失败:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotebooks();
    }, []);

    // 处理新建笔记本
    const handleCreateNotebook = async () => {
        if (!newNotebookTitle.trim()) return;

        try {
            const data = {
                title: newNotebookTitle,
                user: pb.authStore.model?.id,
                note_count: 0,
                generated_count: 0,
                chat_count: 0,
                summary: "",
            };

            const record = await pb.collection('notebooks').create(data);

            setIsCreateDialogOpen(false);
            setNewNotebookTitle("");
            navigate(`/notebook/${record.id}`);
        } catch (error) {
            console.error("创建笔记本失败:", error);
        }
    };

    // 处理删除笔记本
    const handleDeleteNotebook = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("确定要删除该笔记本吗？此操作不可恢复。")) return;

        try {
            // 1. 删除关联的笔记 (notebook_notes)
            const notes = await pb.collection('notebook_notes').getFullList({
                filter: `notebook_id = "${id}"`,
            });
            for (const note of notes) {
                await pb.collection('notebook_notes').delete(note.id);
            }

            // 2. 删除关联的构件 (notebook_artifacts)
            const artifacts = await pb.collection('notebook_artifacts').getFullList({
                filter: `notebook = "${id}"`,
            });
            for (const artifact of artifacts) {
                await pb.collection('notebook_artifacts').delete(artifact.id);
            }

            // 3. 删除关联的会话记录 (notebook_chats)
            const chats = await pb.collection('notebook_chats').getFullList({
                filter: `notebook_id = "${id}"`,
            });
            for (const chat of chats) {
                await pb.collection('notebook_chats').delete(chat.id);
            }

            // 4. 最后删除笔记本
            await pb.collection('notebooks').delete(id);
            setNotebooks(prev => prev.filter(nb => nb.id !== id));
            toast.success("笔记本已删除");
        } catch (error) {
            console.error("删除笔记本失败:", error);
            toast.error("删除失败，请稍后重试");
        }
    };

    // 处理打开编辑对话框
    const handleOpenEdit = (nb: NotebookEntry, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNotebook(nb);
        setEditTitle(nb.title);
        setIsEditDialogOpen(true);
    };

    // 处理保存编辑
    const handleUpdateNotebook = async () => {
        if (!editingNotebook || !editTitle.trim()) return;

        try {
            await pb.collection('notebooks').update(editingNotebook.id, {
                title: editTitle.trim()
            });

            setNotebooks(prev => prev.map(nb =>
                nb.id === editingNotebook.id ? { ...nb, title: editTitle.trim() } : nb
            ));

            setIsEditDialogOpen(false);
            setEditingNotebook(null);
            toast.success("修改成功");
        } catch (error) {
            console.error("更新笔记本失败:", error);
            toast.error("修改失败，请稍后重试");
        }
    };

    // 过滤逻辑
    const filteredNotebooks = notebooks.filter(nb => {
        const matchesSearch = nb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nb.summary.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // 分页逻辑
    const totalPages = Math.ceil(filteredNotebooks.length / itemsPerPage);
    const currentItems = filteredNotebooks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-6 flex flex-col space-y-6 bg-slate-50/30">
            {/* 头部 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">智能笔记本</h1>
                    <p className="text-muted-foreground">记录思考过程，沉淀专业知识，AI 辅助分析深度见解。</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl gap-2">
                            <PlusIcon className="w-5 h-5" />
                            新建笔记本
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>新建笔记本</DialogTitle>
                            <DialogDescription>
                                为您的新笔记本起一个标题，开启智能之旅。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">笔记本标题</Label>
                                <Input
                                    id="title"
                                    placeholder=""
                                    className="rounded-xl"
                                    value={newNotebookTitle}
                                    onChange={(e) => setNewNotebookTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateNotebook();
                                    }}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setIsCreateDialogOpen(false)}
                            >
                                取消
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                onClick={handleCreateNotebook}
                                disabled={!newNotebookTitle.trim()}
                            >
                                立即创建
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 编辑笔记本对话框 */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>编辑笔记本</DialogTitle>
                            <DialogDescription>
                                修改笔记本的标题。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-title">笔记本标题</Label>
                                <Input
                                    id="edit-title"
                                    className="rounded-xl"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateNotebook();
                                    }}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                取消
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                onClick={handleUpdateNotebook}
                                disabled={!editTitle.trim() || editTitle === editingNotebook?.title}
                            >
                                保存修改
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 筛选区域 */}
            <Card className="rounded-2xl border-none bg-white overflow-hidden !p-0">
                <CardContent className="p-3">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="搜索笔记本标题、内容摘要..."
                                className="pl-10 rounded-xl border-slate-200 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="rounded-xl border-slate-200 gap-2 text-slate-600">
                                <ArrowsUpDownIcon className="w-4 h-4" />
                                排序
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 列表区域 */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="rounded-2xl border-none bg-white h-48 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentItems.map((nb) => (
                        <Card
                            key={nb.id}
                            className="group rounded-2xl border-none bg-white hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
                            onClick={() => navigate(`/notebook/${nb.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        <span className="text-[11px]">{nb.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={(e) => handleOpenEdit(nb, e)}
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => handleDeleteNotebook(nb.id, e)}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {nb.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 pb-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <BookOpenIcon className="w-4 h-4" />
                                            <span className="text-xs font-medium">笔记数量</span>
                                        </div>
                                        <span className="text-lg font-bold text-slate-500 ml-5.5">{nb.note_count}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <SparklesIcon className="w-4 h-4" />
                                            <span className="text-xs font-medium">生成数量</span>
                                        </div>
                                        <span className="text-lg font-bold text-slate-500 ml-5.5">{nb.generated_count}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                            <span className="text-xs font-medium">对话数量</span>
                                        </div>
                                        <span className="text-lg font-bold text-slate-500 ml-5.5">{nb.chat_count}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* 无数据展示 */}
            {!loading && currentItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-none">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <BookOpenIcon className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-500 font-medium">未找到相关笔记本</p>
                    <Button variant="link" className="text-blue-600" onClick={() => setSearchTerm("")}>
                        重置搜索条件
                    </Button>
                </div>
            )}

            {/* 分页区域 */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-1 mt-auto">
                    <p className="text-sm text-slate-500">
                        共 <span className="font-medium text-slate-900">{filteredNotebooks.length}</span> 条记录
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-200"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            上一页
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant={currentPage === i + 1 ? "default" : "ghost"}
                                    size="sm"
                                    className={`w-9 h-9 rounded-xl ${currentPage === i + 1 ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100" : "text-slate-500"}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-200"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                            下一页
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
