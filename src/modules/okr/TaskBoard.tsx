import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeftIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { Okr, Task, TaskStatus, Kr, Objective } from './types';
import { TASK_STATUS_OPTIONS } from './types';
import { TaskFormDialog } from './components/TaskFormDialog';

const PRIORITY_ORDER = {
  '高': 3,
  '中': 2,
  '低': 1
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case '高': return 'text-red-600 bg-red-50 border-red-100';
    case '中': return 'text-amber-600 bg-amber-50 border-amber-100';
    case '低': return 'text-blue-600 bg-blue-50 border-blue-100';
    default: return 'text-neutral-600 bg-neutral-50 border-neutral-100';
  }
};

const DraggableTask = ({ task, index, krs, handleEditTask }: {
  task: Task;
  index: number;
  krs: Kr[];
  handleEditTask: (task: Task) => void;
}) => {
  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1
          }}
        >
          <Card
            className="group cursor-pointer rounded-xl hover:shadow-md !p-1 m-1"
            onClick={() => handleEditTask(task)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-sm font-medium leading-tight">{task.name}</span>
                  {task.notes && (
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-normal">
                      {task.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={`px-1.5 py-0 text-[10px] rounded-md border font-normal ${getPriorityColor(task.priority || '中')}`}>
                    {task.priority || '中'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {task.kr && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-100 bg-blue-50/50 truncate max-w-full">
                    KR: {krs.find(k => k.id === task.kr)?.name}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default function TaskBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [okr, setOkr] = useState<Okr | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [krs, setKrs] = useState<Kr[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // 过滤状态
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>("all");
  const [selectedKrId, setSelectedKrId] = useState<string>("all");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [okrData, taskData, krData, objData] = await Promise.all([
        pb.collection('okr_okrs').getOne(id, { $autoCancel: false }),
        pb.collection('okr_tasks').getFullList({
          filter: `okr = "${id}"`,
          sort: 'created',
          $autoCancel: false
        }),
        pb.collection('okr_krs').getFullList({
          filter: `okr = "${id}"`,
          sort: 'created',
          $autoCancel: false
        }),
        pb.collection('okr_objectives').getFullList({
          filter: `okr = "${id}"`,
          sort: 'created',
          $autoCancel: false
        }),
      ]);
      setOkr(okrData as unknown as Okr);
      setTasks(taskData as unknown as Task[]);
      setKrs(krData as unknown as Kr[]);
      setObjectives(objData as unknown as Objective[]);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('加载看板失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 根据选中的目标联动过滤 KR 选项
  const filteredKrOptions = useMemo(() => {
    if (selectedObjectiveId === "all") return krs;
    return krs.filter(kr => kr.objectives.includes(selectedObjectiveId));
  }, [krs, selectedObjectiveId]);

  // 当选中的目标改变时，如果当前选中的 KR 不在新的选项中，重置 KR 过滤
  useEffect(() => {
    if (selectedObjectiveId !== "all" && selectedKrId !== "all") {
      const isStillValid = filteredKrOptions.some(kr => kr.id === selectedKrId);
      if (!isStillValid) {
        setSelectedKrId("all");
      }
    }
  }, [selectedObjectiveId, filteredKrOptions, selectedKrId]);

  // 最终过滤后的任务
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // 按 KR 过滤
    if (selectedKrId !== "all") {
      result = result.filter(task => task.kr === selectedKrId);
    }
    // 按目标过滤 (如果没有选 KR，但选了目标，则显示该目标下所有 KR 的任务)
    else if (selectedObjectiveId !== "all") {
      const targetKrIds = krs
        .filter(kr => kr.objectives.includes(selectedObjectiveId))
        .map(kr => kr.id);
      result = result.filter(task => task.kr && targetKrIds.includes(task.kr));
    }

    return result;
  }, [tasks, selectedObjectiveId, selectedKrId, krs]);

  const handleAddTask = (status: TaskStatus) => {
    setCurrentEditTask({ status } as Task);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentEditTask(task);
    setTaskDialogOpen(true);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;

    // 乐观更新 UI
    const updatedTasks = tasks.map(t =>
      t.id === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    // 后端同步
    pb.collection('okr_tasks').update(draggableId, { status: newStatus })
      .then(() => {
        // 成功后重新获取数据以确保同步
        fetchData();
      })
      .catch((error) => {
        console.error('Update task status error:', error);
        toast.error('更新状态失败');
        // 失败时回滚
        fetchData();
      });
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!okr) return <div className="p-8 text-center">未找到 OKR</div>;

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col space-y-6 p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/okr/detail/${id}`)} className="rounded-full">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{okr.name} - 任务看板</h1>
            <p className="text-sm text-neutral-500">
              {okr.start_date ? new Date(okr.start_date).toLocaleDateString() : '-'} 至 {okr.end_date ? new Date(okr.end_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
        <Button onClick={() => handleAddTask('待开始')} className="bg-blue-600 hover:bg-blue-700 rounded-2xl">
          <PlusIcon className="mr-2 h-4 w-4" />
          添加任务
        </Button>
      </div>

      {/* 过滤器区域 */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl p-3 bg-white dark:bg-neutral-900/50 border-1">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-500">过滤条件：</span>
        </div>

        <div className="flex items-center gap-4">
          {/* 目标选择器 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">目标:</span>
            <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
              <SelectTrigger className="h-9 w-[200px] rounded-xl border-none bg-neutral-100 dark:bg-neutral-800">
                <SelectValue placeholder="所有目标" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">所有目标</SelectItem>
                {objectives.map(obj => (
                  <SelectItem key={obj.id} value={obj.id}>{obj.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 关键结果选择器 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">关键结果:</span>
            <Select value={selectedKrId} onValueChange={setSelectedKrId}>
              <SelectTrigger className="h-9 w-[200px] rounded-xl border-none bg-neutral-100 dark:bg-neutral-800">
                <SelectValue placeholder="所有关键结果" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">所有关键结果</SelectItem>
                {filteredKrOptions.map(kr => (
                  <SelectItem key={kr.id} value={kr.id}>{kr.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 重置按钮 */}
          {(selectedObjectiveId !== "all" || selectedKrId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedObjectiveId("all");
                setSelectedKrId("all");
              }}
              className="h-8 px-2 text-xs text-neutral-400 hover:text-red-500"
            >
              <XMarkIcon className="mr-1 h-3 w-3" />
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {isMounted && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-6 overflow-x-auto">
            {TASK_STATUS_OPTIONS.map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex flex-1 flex-col rounded-2xl p-4 transition-colors ${snapshot.isDraggingOver
                      ? 'bg-neutral-200/50 dark:bg-neutral-800/50'
                      : 'bg-neutral-100/50 dark:bg-neutral-900/50'
                      }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-neutral-700 dark:text-neutral-300">{status}</h3>
                        <Badge variant="secondary" className="rounded-full">
                          {filteredTasks.filter(t => t.status === status).length}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleAddTask(status)}>
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 overflow-y-auto min-h-[100px]">
                      {filteredTasks
                        .filter(t => t.status === status)
                        .sort((a, b) => (PRIORITY_ORDER[b.priority] || PRIORITY_ORDER['中']) - (PRIORITY_ORDER[a.priority] || PRIORITY_ORDER['中']))
                        .map((task, index) => (
                          <DraggableTask
                            key={task.id}
                            task={task}
                            index={index}
                            krs={krs}
                            handleEditTask={handleEditTask}
                          />
                        ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        okrId={id!}
        krs={krs}
        task={currentEditTask}
        onSuccess={fetchData}
      />
    </div>
  );
}
