import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';
import type { FinanceCategory } from './types';
import { FinanceCategoryFormDrawer } from './components/FinanceCategoryFormDrawer';

export default function FinanceCategories() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('finance_categories').getFullList<FinanceCategory>({
        sort: 'created',
      });
      setCategories(records);
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return;
      console.error('Failed to fetch categories:', error);
      toast.error('获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditingCategory(null);
    setDrawerOpen(true);
  };

  const handleEdit = (category: FinanceCategory) => {
    setEditingCategory(category);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (category: FinanceCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await pb.collection('finance_categories').delete(categoryToDelete.id);
      toast.success('分类已删除');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('删除失败，可能该分类下有关联记录');
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">分类管理</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            管理您的收支分类。
          </p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="mr-2 h-4 w-4" />
          新增分类
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
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
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    暂无分类数据
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant={category.type === 'income' ? 'default' : 'secondary'} className={category.type === 'income' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                        {category.type === 'income' ? '收入' : '支出'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">打开菜单</span>
                            <EllipsisHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(category)}>
                            <PencilSquareIcon className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteClick(category)}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FinanceCategoryFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        category={editingCategory}
        onSuccess={fetchCategories}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除分类“{categoryToDelete?.name}”吗？此操作无法撤销。
              如果该分类下存在记账记录，可能导致删除失败。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
