import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  ChartBarIcon,
  ViewColumnsIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Okr } from './types';
import { OkrFormDrawer } from './components/OkrFormDrawer';
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

const COLLECTION_NAME = 'okr_okrs';

export default function OkrList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<Okr[]>([]);
  const [loading, setLoading] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [currentOkr, setCurrentOkr] = useState<Okr | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchOkrs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await pb.collection(COLLECTION_NAME).getList(1, 50, {
        sort: '-created',
        filter: `user = "${user.id}"`,
      });
      setOkrs(result.items as unknown as Okr[]);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Fetch error:', error);
        toast.error('获取 OKRs 失败');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOkrs();
  }, [fetchOkrs]);

  const handleCreate = () => {
    setCurrentOkr(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (okr: Okr) => {
    setCurrentOkr(okr);
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
      fetchOkrs();
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '未开始': return 'bg-neutral-100 text-neutral-600';
      case '进行中': return 'bg-blue-100 text-blue-600';
      case '已完成': return 'bg-green-100 text-green-600';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            我的 OKRs
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            在这里管理您的目标与关键结果，追踪任务进度。
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 rounded-2xl">
          <PlusIcon className="mr-2 h-4 w-4" />
          创建 OKR
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {okrs.map((okr) => (
          <Card
            key={okr.id}
            className="overflow-hidden rounded-2xl border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-lg cursor-pointer group"
            onClick={() => navigate(`/okr/detail/${okr.id}`)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <Badge className={getStatusColor(okr.status)}>
                  {okr.status}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(okr);
                    }}
                    className="h-8 w-8 text-neutral-500 hover:text-blue-600"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(okr.id);
                    }}
                    className="h-8 w-8 text-neutral-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-4 text-xl line-clamp-1 group-hover:text-blue-600 transition-colors">
                {okr.name}
              </CardTitle>
              <p className="text-sm text-neutral-500">
                {okr.start_date ? new Date(okr.start_date).toLocaleDateString() : '-'} 至 {okr.end_date ? new Date(okr.end_date).toLocaleDateString() : '-'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/okr/detail/${okr.id}`);
                  }}
                >
                  <ChartBarIcon className="mr-2 h-4 w-4" />
                  详情报告
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/okr/board/${okr.id}`);
                  }}
                >
                  <ViewColumnsIcon className="mr-2 h-4 w-4" />
                  任务看板
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {okrs.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <ChartBarIcon className="h-16 w-16 opacity-20" />
          <p className="mt-4 text-lg font-medium">还没有 OKR，点击右上角创建一个吧</p>
        </div>
      )}

      <OkrFormDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        okr={currentOkr}
        onSuccess={fetchOkrs}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除 OKR？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该 OKR 及其关联的所有目标、关键结果和任务，无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
