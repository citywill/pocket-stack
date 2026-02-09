import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import type { Post, PostStatus } from './types';
import { STATUS_OPTIONS } from './types';
import { PostFormDrawer } from './components/PostFormDrawer';
import { PostDetailDrawer } from './components/PostDetailDrawer';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

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

const COLLECTION_NAME = 'examples_posts';

export default function CurdExample() {
  // --- 数据状态 ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- 确认弹窗状态 ---
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // --- 筛选/分页/排序状态 ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof Post>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- 抽屉状态 ---
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // --- 获取数据 ---
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const filterParts: string[] = [];
      if (search) {
        filterParts.push(`title ~ "${search}"`);
      }
      if (statusFilter !== 'all') {
        filterParts.push(`status = "${statusFilter}"`);
      }

      const sortStr = `${sortOrder === 'desc' ? '-' : ''}${String(sortField)}`;

      const result = await pb.collection(COLLECTION_NAME).getList(currentPage, pageSize, {
        filter: filterParts.join(' && '),
        sort: sortStr,
        requestKey: 'posts_list', // 显式指定 key 以便 SDK 自动取消重复请求，或者设置为 null 禁用自动取消
      });

      setPosts(result.items as unknown as Post[]);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      // 如果是 SDK 自动取消的请求，不作为错误处理
      if (error.isAbort) {
        return;
      }

      console.error('Fetch error:', error);
      // 如果 collection 不存在，给一个友好的提示或空数组
      if (error.status === 404) {
        setPosts([]);
        setTotalItems(0);
      } else {
        toast.error('获取数据失败');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // --- 处理排序 ---
  const handleSort = (field: keyof Post) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // --- CRUD 操作 ---
  const handleCreate = () => {
    setCurrentPost(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (post: Post) => {
    setCurrentPost(post);
    setFormDrawerOpen(true);
  };

  const handleView = (post: Post) => {
    setCurrentPost(post);
    setDetailDrawerOpen(true);
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
      fetchPosts();
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleSave = async (data: Partial<Post>) => {
    setActionLoading(true);
    try {
      // 过滤掉系统字段
      const { id, created, updated, ...payload } = data as any;

      if (currentPost) {
        await pb.collection(COLLECTION_NAME).update(currentPost.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection(COLLECTION_NAME).create(payload);
        toast.success('创建成功');
      }
      setFormDrawerOpen(false);
      fetchPosts();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            文章管理 (CRUD 示例)
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            这是一个完整的 CRUD 示例，包含表格展示、抽屉表单、抽屉详情、分页、过滤和排序功能。
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="mr-2 h-4 w-4" />
          创建文章
        </Button>
      </div>

      {/* --- 筛选器 --- */}
      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <Input
              name="search"
              placeholder="搜索标题..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as any);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger id="filter-status" className="w-[180px]">
              <FunnelIcon className="mr-2 h-4 w-4 text-neutral-400" />
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className="text-neutral-500"
          >
            重置筛选
          </Button>
        </div>
      </div>

      {/* --- 表格 --- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>文章列表</CardTitle>
            <span className="text-sm text-neutral-500">
              共 {totalItems} 条记录
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th
                    className="cursor-pointer pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      标题
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    作者
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    分类
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    状态
                  </th>
                  <th
                    className="cursor-pointer pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    onClick={() => handleSort('created')}
                  >
                    <div className="flex items-center gap-1">
                      创建时间
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-neutral-500">
                      加载中...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-neutral-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="py-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {post.title}
                      </td>
                      <td className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {post.author}
                      </td>
                      <td className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {post.category}
                      </td>
                      <td className="py-4">
                        <Badge
                          className={cn(STATUS_OPTIONS.find((s) => s.value === post.status)?.color)}
                          variant="secondary"
                        >
                          {STATUS_OPTIONS.find((s) => s.value === post.status)?.label}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {format(parseISO(post.created), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(post)}
                            className="h-8 w-8 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(post)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(post.id)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- 分页 --- */}
          {!loading && totalItems > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <p className="text-sm text-neutral-500">
                第 {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeftIcon className="mr-1 h-4 w-4" />
                  上一页
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    if (pageNum <= 0) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页
                  <ChevronRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- 抽屉组件 --- */}
      <PostFormDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        post={currentPost}
        onSave={handleSave}
        loading={actionLoading}
      />

      <PostDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        post={currentPost}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这篇文章吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。删除后，该文章将永久从系统中移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              确定删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
