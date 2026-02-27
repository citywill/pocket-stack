import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { PencilSquareIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, ArrowLeftIcon, TagIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Prompt {
    id: string;
    user: string;
    title: string;
    content: string;
    created: string;
    updated: string;
}

export default function Prompts() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
    const [promptTitle, setPromptTitle] = useState('');
    const [promptContent, setPromptContent] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchPrompts();
        }
    }, [user?.id]);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const records = await pb.collection('note_prompts').getFullList<Prompt>({
                filter: `user = "${user?.id}"`,
                sort: '-created',
                requestKey: null,
            });
            setPrompts(records);
        } catch (error) {
            console.error('Failed to fetch prompts:', error);
            toast.error('获取提示词列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!promptTitle.trim() || !promptContent.trim()) return;
        try {
            await pb.collection('note_prompts').create({
                title: promptTitle,
                content: promptContent,
                user: user?.id
            });
            toast.success('提示词创建成功');
            setIsCreateOpen(false);
            setPromptTitle('');
            setPromptContent('');
            fetchPrompts();
        } catch (error) {
            toast.error('创建失败');
        }
    };

    const handleUpdate = async () => {
        if (!currentPrompt || !promptTitle.trim() || !promptContent.trim()) return;
        try {
            await pb.collection('note_prompts').update(currentPrompt.id, {
                title: promptTitle,
                content: promptContent
            });
            toast.success('提示词更新成功');
            setIsEditOpen(false);
            setPromptTitle('');
            setPromptContent('');
            setCurrentPrompt(null);
            fetchPrompts();
        } catch (error) {
            toast.error('更新失败');
        }
    };

    const handleDelete = async () => {
        if (!currentPrompt) return;
        try {
            await pb.collection('note_prompts').delete(currentPrompt.id);
            toast.success('提示词删除成功');
            setIsDeleteOpen(false);
            setCurrentPrompt(null);
            fetchPrompts();
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const filteredPrompts = prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <h1 className="text-2xl font-bold tracking-tight">预置提示词管理</h1>
                        <p className="text-muted-foreground mt-1">管理您的智能生成预置提示词</p>
                    </div>
                </div>
                <Button onClick={() => {
                    setPromptTitle('');
                    setPromptContent('');
                    setIsCreateOpen(true);
                }}>
                    <PlusIcon className="size-4 mr-2" />
                    新建提示词
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索提示词..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>标题</TableHead>
                            <TableHead>内容</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    加载中...
                                </TableCell>
                            </TableRow>
                        ) : filteredPrompts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    暂无提示词
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPrompts.map((prompt) => (
                                <TableRow key={prompt.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <TagIcon className="size-4 text-muted-foreground" />
                                            {prompt.title}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <p className="truncate">{prompt.content}</p>
                                    </TableCell>
                                    <TableCell>{new Date(prompt.created).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setCurrentPrompt(prompt);
                                                    setPromptTitle(prompt.title);
                                                    setPromptContent(prompt.content);
                                                    setIsEditOpen(true);
                                                }}
                                            >
                                                <PencilSquareIcon className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    setCurrentPrompt(prompt);
                                                    setIsDeleteOpen(true);
                                                }}
                                            >
                                                <TrashIcon className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建提示词</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="输入提示词标题"
                            value={promptTitle}
                            onChange={(e) => setPromptTitle(e.target.value)}
                        />
                        <Textarea
                            placeholder="输入提示词内容"
                            value={promptContent}
                            onChange={(e) => setPromptContent(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                        <Button onClick={handleCreate}>创建</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑提示词</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="输入提示词标题"
                            value={promptTitle}
                            onChange={(e) => setPromptTitle(e.target.value)}
                        />
                        <Textarea
                            placeholder="输入提示词内容"
                            value={promptContent}
                            onChange={(e) => setPromptContent(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>取消</Button>
                        <Button onClick={handleUpdate}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除？</AlertDialogTitle>
                        <AlertDialogDescription>
                            这将永久删除提示词 "{currentPrompt?.title}"。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
