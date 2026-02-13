import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ViewColumnsIcon,
  InformationCircleIcon,
  FlagIcon,
  ClipboardDocumentCheckIcon,
  ListBulletIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { Okr, Objective, Kr, Task } from './types';
import { ObjectiveFormDialog } from './components/ObjectiveFormDialog';
import { KrFormDialog } from './components/KrFormDialog';
import { TaskFormDialog } from './components/TaskFormDialog';
import { OkrFormDrawer } from './components/OkrFormDrawer';
import { StatCards } from './components/StatCards';
import { OkrTreeView } from './components/OkrTreeView';
import { OkrListView } from './components/OkrListView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function OkrDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [okr, setOkr] = useState<Okr | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [krs, setKrs] = useState<Kr[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  // 弹窗状态
  const [objDialogOpen, setObjDialogOpen] = useState(false);
  const [krDialogOpen, setKrDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [descDialogOpen, setDescDialogOpen] = useState(false);
  const [okrDrawerOpen, setOkrDrawerOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [okrData, objData, krData, taskData] = await Promise.all([
        pb.collection('okr_okrs').getOne(id, { $autoCancel: false }),
        pb.collection('okr_objectives').getFullList({
          filter: `okr = "${id}"`,
          sort: 'created',
          $autoCancel: false
        }),
        pb.collection('okr_krs').getFullList({
          filter: `okr = "${id}"`,
          sort: 'created',
          $autoCancel: false
        }),
        pb.collection('okr_tasks').getFullList({
          filter: `okr = "${id}"`,
          sort: 'created',
          $autoCancel: false
        }),
      ]);

      setOkr(okrData as unknown as Okr);
      setObjectives(objData as unknown as Objective[]);
      setKrs(krData as unknown as Kr[]);
      setTasks(taskData as unknown as Task[]);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!okr) return <div className="p-8 text-center">未找到 OKR</div>;

  // 计算统计数据
  const krProgress = krs.length > 0
    ? Math.round(krs.reduce((acc, kr) => acc + (kr.current_value / kr.target_value), 0) / krs.length * 100)
    : 0;

  const completedTasks = tasks.filter(t => t.status === '已完成').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // 计算时间进度
  let timeProgress = 0;
  if (okr.start_date && okr.end_date) {
    const start = new Date(okr.start_date).getTime();
    const end = new Date(okr.end_date).getTime();
    const now = new Date().getTime();

    if (now > end) {
      timeProgress = 100;
    } else if (now < start) {
      timeProgress = 0;
    } else {
      timeProgress = Math.round(((now - start) / (end - start)) * 100);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/okr/list')} className="rounded-full">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{okr.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-neutral-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => setDescDialogOpen(true)}
              >
                <InformationCircleIcon className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              周期：{okr.start_date ? new Date(okr.start_date).toLocaleDateString() : '-'} 至 {okr.end_date ? new Date(okr.end_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 transition-all"
            onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
          >
            {viewMode === 'list' ? (
              <>
                <RectangleGroupIcon className="mr-2 h-4 w-4" />
                浏览模式
              </>
            ) : (
              <>
                <ListBulletIcon className="mr-2 h-4 w-4" />
                列表模式
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/okr/board/${id}`)}
            className="rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <ViewColumnsIcon className="mr-2 h-4 w-4" /> 任务看板
          </Button>


          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={() => setOkrDrawerOpen(true)}
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" /> 编辑OKR
          </Button>
        </div>
      </div>

      <Dialog open={descDialogOpen} onOpenChange={setDescDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>{okr.name} 详情描述</DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
            {okr.description || '暂无详细描述'}
          </div>
        </DialogContent>
      </Dialog>

      {/* 概览统计卡片 */}
      <StatCards
        objectivesCount={objectives.length}
        krProgress={krProgress}
        taskProgress={taskProgress}
        timeProgress={timeProgress}
      />

      {viewMode === 'list' ? (
        <OkrListView
          objectives={objectives}
          krs={krs}
          tasks={tasks}
          onEditObjective={(obj) => { setCurrentEditItem(obj); setObjDialogOpen(true); }}
          onEditKr={(kr) => { setCurrentEditItem(kr); setKrDialogOpen(true); }}
          onEditTask={(task) => { setCurrentEditItem(task); setTaskDialogOpen(true); }}
          onAddObjective={() => { setCurrentEditItem(null); setObjDialogOpen(true); }}
          onAddKrWithObjective={(objId) => { setCurrentEditItem({ objectives: [objId] }); setKrDialogOpen(true); }}
          onAddTask={() => { setCurrentEditItem(null); setTaskDialogOpen(true); }}
          onAddTaskWithKr={(krId) => { setCurrentEditItem({ kr: krId }); setTaskDialogOpen(true); }}
          onRefresh={fetchData}
        />
      ) : (
        <OkrTreeView
          objectives={objectives}
          krs={krs}
          tasks={tasks}
          onAddKr={(objId) => { setCurrentEditItem(objId ? { objectives: [objId] } : null); setKrDialogOpen(true); }}
          onAddTask={(krId) => { setCurrentEditItem(krId ? { kr: krId } : null); setTaskDialogOpen(true); }}
        />
      )}

      {/* 弹窗组件 */}
      <ObjectiveFormDialog
        open={objDialogOpen}
        onOpenChange={setObjDialogOpen}
        okrId={id!}
        objective={currentEditItem}
        onSuccess={fetchData}
      />
      <KrFormDialog
        open={krDialogOpen}
        onOpenChange={setKrDialogOpen}
        okrId={id!}
        objectives={objectives}
        kr={currentEditItem}
        onSuccess={fetchData}
      />
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        okrId={id!}
        krs={krs}
        task={currentEditItem}
        onSuccess={fetchData}
      />
      <OkrFormDrawer
        open={okrDrawerOpen}
        onOpenChange={setOkrDrawerOpen}
        okr={okr}
        onSuccess={fetchData}
      />
    </div>
  );
}
