import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { TagIcon, PencilSquareIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Tag {
    id: string;
    name: string;
    created: string;
    updated: string;
    count?: number;
}

export default function Tags() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentTag, setCurrentTag] = useState<Tag | null>(null);
    const [tagName, setTagName] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchTags();
        }
    }, [user?.id]);

    const fetchTags = async () => {
        setLoading(true);
        try {
            const records = await pb.collection('note_tags').getFullList<Tag>({
                filter: `user = "${user?.id}"`,
                sort: '-created',
                requestKey: null,
            });

            // Parallel count fetching
            const tagsWithCounts = await Promise.all(records.map(async (tag) => {
                try {
                    const result = await pb.collection('note_tag_links').getList(1, 1, {
                        filter: `tag = "${tag.id}" && note.user = "${user?.id}" && note.isDeleted != true`,
                        requestKey: null,
                    });
                    return { ...tag, count: result.totalItems };
                } catch (e) {
                    return { ...tag, count: 0 };
                }
            }));

            setTags(tagsWithCounts);
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            toast.error('获取标签列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!tagName.trim()) return;
        try {
            await pb.collection('note_tags').create({
                name: tagName,
                user: user?.id
            });
            toast.success('标签创建成功');
            setIsCreateOpen(false);
            setTagName('');
            fetchTags();
        } catch (error) {
            toast.error('创建失败');
        }
    };

    const handleUpdate = async () => {
        if (!currentTag || !tagName.trim()) return;
        try {
            await pb.collection('note_tags').update(currentTag.id, {
                name: tagName
            });
            toast.success('标签更新成功');
            setIsEditOpen(false);
            setTagName('');
            setCurrentTag(null);
            fetchTags();
        } catch (error) {
            toast.error('更新失败');
        }
    };

    const handleDelete = async () => {
        if (!currentTag) return;
        try {
            await pb.collection('note_tags').delete(currentTag.id);
            toast.success('标签删除成功');
            setIsDeleteOpen(false);
            setCurrentTag(null);
            fetchTags();
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const filteredTags = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <h1 className="text-2xl font-bold tracking-tight">标签管理</h1>
                        <p className="text-muted-foreground mt-1">管理您的笔记标签</p>
                    </div>
                </div>
                <Button onClick={() => {
                    setTagName('');
                    setIsCreateOpen(true);
                }}>
                    <PlusIcon className="size-4 mr-2" />
                    新建标签
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索标签..."
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
                            <TableHead>名称</TableHead>
                            <TableHead>关联笔记数</TableHead>
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
                        ) : filteredTags.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    暂无标签
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTags.map((tag) => (
                                <TableRow key={tag.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <TagIcon className="size-4 text-muted-foreground" />
                                            {tag.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{tag.count || 0}</TableCell>
                                    <TableCell>{new Date(tag.created).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setCurrentTag(tag);
                                                    setTagName(tag.name);
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
                                                    setCurrentTag(tag);
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

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建标签</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="输入标签名称"
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                        <Button onClick={handleCreate}>创建</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑标签</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="输入标签名称"
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>取消</Button>
                        <Button onClick={handleUpdate}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除？</AlertDialogTitle>
                        <AlertDialogDescription>
                            这将永久删除标签 "{currentTag?.name}"。关联的笔记不会被删除，但标签将从这些笔记中移除。
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
