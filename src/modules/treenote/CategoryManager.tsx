import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { TreeSelect } from '@/components/ui/tree-select';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { Category, CategoryTreeNode } from './types';
import { cn } from '@/lib/utils';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const COLLECTION_NAME = 'treenote_categories';

function CategoryFormDrawer({
  open,
  onOpenChange,
  category,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  categories: Category[];
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [parent, setParent] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParent(category.parent || '');
    } else {
      setName('');
      setParent('');
    }
  }, [category, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { name: name.trim() };
      payload.parent = parent;

      if (category) {
        await pb.collection(COLLECTION_NAME).update(category.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection(COLLECTION_NAME).create(payload);
        toast.success('创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{category ? '编辑分类' : '创建分类'}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">分类名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入分类名称"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">上级分类</Label>
            <TreeSelect
              value={parent}
              onChange={setParent}
              categories={categories.filter((c) => c.id !== category?.id)}
              placeholder="无上级分类（顶级）"
            />
          </div>
        </div>
        <SheetFooter className="mt-8 flex gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const buildTree = useCallback((cats: Category[]): CategoryTreeNode[] => {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    cats.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    map.forEach((node) => {
      if (node.parent && map.has(node.parent)) {
        map.get(node.parent)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await pb.collection(COLLECTION_NAME).getFullList({
        sort: 'created',
        requestKey: null,
      });
      const cats = result as unknown as Category[];
      setCategories(cats);
      setTreeData(buildTree(cats));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('获取分类失败');
    } finally {
      setLoading(false);
    }
  }, [buildTree]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = () => {
    setCurrentCategory(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (category: Category) => {
    setCurrentCategory(category);
    setFormDrawerOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await pb.collection(COLLECTION_NAME).delete(deleteTargetId);
      toast.success('删除成功');
      fetchCategories();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '顶级分类';
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || '未知';
  };

  const renderTreeNode = (node: CategoryTreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors'
          )}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-7" />
            )}
            {isExpanded || !hasChildren ? (
              <FolderOpenIcon className="w-4 h-4 shrink-0 text-primary" />
            ) : (
              <FolderIcon className="w-4 h-4 shrink-0 text-primary" />
            )}
            <span className="font-medium truncate">{node.name}</span>
            <span className="text-sm text-gray-400 truncate">
              ({node.children.length}个子分类)
            </span>
          </div>
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(node)}
              className="rounded-xl"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </Button>
            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(node.id)}
                        disabled={hasChildren}
                        className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {hasChildren && (
                    <TooltipContent>
                      有子分类，无法删除
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
          <PlusIcon className="w-4 h-4 mr-2" />
          创建分类
        </Button>
      </div>

      <Card className="p-4">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : treeData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无分类</div>
          ) : (
            <div>
              {treeData.map((node) => renderTreeNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryFormDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        category={currentCategory}
        categories={categories}
        onSuccess={fetchCategories}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个分类吗？如果该分类有子分类，子分类会变成顶级分类。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}