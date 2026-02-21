import { useState, useEffect, useCallback } from 'react';
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
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { ClientResponseError } from 'pocketbase';
import type { FinanceRecord } from './types';
import { RECORD_TYPE_OPTIONS } from './types';
import { FinanceFormDrawer } from './components/FinanceFormDrawer';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';

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

const COLLECTION_NAME = 'finance_records';

export default function FinanceRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<FinanceRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const filterParts: string[] = [`user = "${user.id}"`];
      if (search) {
        filterParts.push(`note ~ "${search}"`);
      }
      if (typeFilter !== 'all') {
        filterParts.push(`type = "${typeFilter}"`);
      }

      const result = await pb.collection(COLLECTION_NAME).getList(currentPage, pageSize, {
        filter: filterParts.join(' && '),
        sort: '-date',
        expand: 'category',
        requestKey: 'finance_records_list',
      });

      setRecords(result.items as unknown as FinanceRecord[]);
      setTotalItems(result.totalItems);
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) return;
      console.error('Fetch error:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, pageSize, search, typeFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCreate = () => {
    setCurrentRecord(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (record: FinanceRecord) => {
    setCurrentRecord(record);
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
      fetchRecords();
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleSave = async (data: Partial<FinanceRecord>) => {
    if (!user) return;
    setActionLoading(true);
    try {
      // 移除可能存在的只读字段
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expand, created, updated, id, ...restData } = data as any;

      const payload = {
        ...restData,
        user: user.id,
      };

      if (currentRecord) {
        await pb.collection(COLLECTION_NAME).update(currentRecord.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection(COLLECTION_NAME).create(payload);
        toast.success('创建成功');
      }
      setFormDrawerOpen(false);
      fetchRecords();
    } catch (error) {
      console.error('Save error:', error);
      if (error instanceof ClientResponseError) {
        console.error('Error data:', error.data);
        toast.error(`保存失败: ${error.message}`);
      } else {
        toast.error('保存失败');
      }
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
            记账记录
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            管理您的每一笔收支记录。
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusIcon className="mr-2 h-4 w-4" />
          新增记账
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="搜索备注..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <FunnelIcon className="mr-2 h-4 w-4 text-neutral-400" />
              <SelectValue placeholder="所有类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有类型</SelectItem>
              {RECORD_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">日期</th>
                <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">类型</th>
                <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">分类</th>
                <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">金额</th>
                <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">备注</th>
                <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    加载中...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    暂无记录
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(record.date), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={record.type === 'income' ? 'default' : 'destructive'}
                        className={cn(
                          record.type === 'income' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'
                        )}
                      >
                        {record.type === 'income' ? '收入' : '支出'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{record.expand?.category?.name || '-'}</td>
                    <td className={cn(
                      "px-6 py-4 font-medium",
                      record.type === 'income' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {record.type === 'income' ? '+' : '-'}{record.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">{record.note || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(record.id)}>
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
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            共 {totalItems} 条记录
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              第 {currentPage} / {totalPages || 1} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <FinanceFormDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        record={currentRecord}
        onSave={handleSave}
        loading={actionLoading}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，确定要删除这条记账记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
