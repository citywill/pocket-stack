import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Tag01Icon,
    MoreHorizontalIcon,
    PencilEdit01Icon,
    Delete02Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface Tag {
    id: string;
    name: string;
    count?: number;
}

interface TagListProps {
    onTagsCountChange?: (count: number) => void;
    refreshTrigger?: any; // 用于触发刷新，比如热力图数据更新时
}

export function TagList({ onTagsCountChange, refreshTrigger }: TagListProps) {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tags, setTags] = useState<Tag[]>([]);
    const activeTagId = searchParams.get('tag');

    // 编辑状态
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [newTagName, setNewTagName] = useState('');

    // 删除状态
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchTags();
        }
    }, [user?.id, refreshTrigger]);

    const fetchTags = async () => {
        try {
            const records = await pb.collection('note_tags').getFullList<Tag>({
                filter: `user = "${user?.id}"`,
                sort: 'name',
                requestKey: null,
            });

            // 并行获取每个标签的笔记数量（仅统计当前用户的、未被软删除的笔记）
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
            onTagsCountChange?.(tagsWithCounts.length);
        } catch (error: any) {
            if (!error.isAbort) {
                console.error('Failed to fetch tags:', error);
            }
        }
    };

    const handleTagClick = (tagId: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (activeTagId === tagId) {
            newParams.delete('tag');
        } else {
            newParams.set('tag', tagId);
        }
        setSearchParams(newParams);
    };

    const handleEditClick = (e: React.MouseEvent, tag: Tag) => {
        e.stopPropagation();
        setEditingTag(tag);
        setNewTagName(tag.name);
        setIsEditDialogOpen(true);
    };

    const handleUpdateTag = async () => {
        if (!editingTag || !newTagName || newTagName === editingTag.name) {
            setIsEditDialogOpen(false);
            return;
        }

        try {
            await pb.collection('note_tags').update(editingTag.id, { name: newTagName });
            toast.success('标签已更新');
            setIsEditDialogOpen(false);
            fetchTags();
        } catch (error) {
            toast.error('更新失败');
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, tag: Tag) => {
        e.stopPropagation();
        setTagToDelete(tag);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!tagToDelete) return;

        try {
            await pb.collection('note_tags').delete(tagToDelete.id);
            toast.success('标签已删除');
            if (activeTagId === tagToDelete.id) {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('tag');
                setSearchParams(newParams);
            }
            setIsDeleteDialogOpen(false);
            fetchTags();
        } catch (error) {
            toast.error('删除失败');
        }
    };

    if (tags.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="px-3">
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                    <HugeiconsIcon icon={Tag01Icon} size={14} />
                    标签
                </h3>
            </div>
            <div className="space-y-1">
                {tags.map((tag) => (
                    <div key={tag.id} className="group relative">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 rounded-xl h-9 px-3 transition-all duration-200",
                                activeTagId === tag.id
                                    ? "bg-blue-50 text-blue-600 font-medium"
                                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                            )}
                            onClick={() => handleTagClick(tag.id)}
                        >
                            <div className="flex items-center w-full">
                                <span className="text-sm truncate max-w-[120px]"># {tag.name}</span>
                                {tag.count !== undefined && tag.count > 0 && (
                                    <span className={cn(
                                        "ml-2 text-[10px] px-1 rounded-full",
                                        activeTagId === tag.id
                                            ? "text-blue-600/70"
                                            : "text-muted-foreground/50"
                                    )}>
                                        {tag.count}
                                    </span>
                                )}
                            </div>
                        </Button>

                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg hover:bg-slate-200/50 text-muted-foreground/40 hover:text-foreground"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem onClick={(e) => handleEditClick(e, tag)}>
                                        <HugeiconsIcon icon={PencilEdit01Icon} size={14} className="mr-2" />
                                        <span>编辑</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => handleDeleteClick(e, tag)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
                                        <span>删除</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            {/* 编辑标签对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>编辑标签</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Input
                                id="name"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="标签名称"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateTag();
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleUpdateTag}>
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除标签吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            删除标签“{tagToDelete?.name}”不会删除关联的笔记，但该标签将从所有笔记中移除。此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                            取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
