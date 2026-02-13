import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { PlusIcon, FunnelIcon, TagIcon, XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { pb } from '@/lib/pocketbase';
import type { KanbanTask, KanbanTaskStatus, KanbanTag, KanbanTaskPriority } from './types';
import { KanbanCard } from './components/KanbanCard';
import { TaskFormDrawer } from './components/TaskFormDrawer';
import { TagManager } from './components/TagManager';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLUMNS: { id: KanbanTaskStatus; title: string }[] = [
  { id: 'todo', title: '待处理' },
  { id: 'in_progress', title: '进行中' },
  { id: 'done', title: '已完成' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [tags, setTags] = useState<KanbanTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | undefined>(undefined);
  const [defaultStatus, setDefaultStatus] = useState<KanbanTaskStatus>('todo');

  // --- 筛选状态 ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<KanbanTaskPriority | 'all'>('all');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  // 防抖处理搜索输入
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTasks = useCallback(async () => {
    try {
      const filterParts: string[] = [];
      if (debouncedSearch) {
        filterParts.push(`title ~ "${debouncedSearch}"`);
      }
      if (priorityFilter !== 'all') {
        filterParts.push(`priority = "${priorityFilter}"`);
      }
      if (tagFilters.length > 0) {
        const tagFilterStr = tagFilters.map(id => `tags ~ "${id}"`).join(' || ');
        filterParts.push(`(${tagFilterStr})`);
      }

      // 归档过滤逻辑
      filterParts.push(`is_archived = ${showArchived}`);

      const [tasksResult, tagsResult] = await Promise.all([
        pb.collection('kanban_tasks').getFullList<KanbanTask>({
          sort: 'order',
          expand: 'tags',
          filter: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
          requestKey: 'kanban_tasks_list', // 手动指定 requestKey 防止自动取消
        }),
        pb.collection('kanban_tags').getFullList<KanbanTag>({
          requestKey: 'kanban_tags_list', // 手动指定 requestKey 防止自动取消
        }),
      ]);
      setTasks(tasksResult);
      setTags(tagsResult);
    } catch (error: any) {
      if (error.isAbort) return; // 忽略正常的请求取消
      console.error('Fetch error:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, priorityFilter, tagFilters, showArchived]);

  useEffect(() => {
    fetchTasks();
    // 订阅任务更新
    pb.collection('kanban_tasks').subscribe('*', () => {
      fetchTasks();
    });

    return () => {
      pb.collection('kanban_tasks').unsubscribe();
    };
  }, [fetchTasks]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as KanbanTaskStatus;
    const oldStatus = source.droppableId as KanbanTaskStatus;

    // 1. 本地状态乐观更新
    const updatedTasks = Array.from(tasks);

    // 找出正在移动的任务
    const taskIndex = updatedTasks.findIndex((t) => t.id === draggableId);
    const [movedTask] = updatedTasks.splice(taskIndex, 1);

    // 更新状态
    movedTask.status = newStatus;

    // 找出目标列的所有任务（不包含当前正在移动的任务）
    const destColumnTasks = updatedTasks.filter(t => t.status === newStatus);

    // 插入到新位置
    destColumnTasks.splice(destination.index, 0, movedTask);

    // 重新计算目标列中所有任务的 order
    destColumnTasks.forEach((t, i) => {
      t.order = i;
    });

    // 合并回主任务列表
    const otherTasks = updatedTasks.filter(t => t.status !== newStatus);
    const finalTasks = [...otherTasks, ...destColumnTasks].sort((a, b) => {
      if (a.status !== b.status) return 0; // 同一列内按 order 排序
      return a.order - b.order;
    });

    setTasks(finalTasks);

    try {
      // 2. 同步到后端
      // 更新当前任务的状态和位置
      await pb.collection('kanban_tasks').update(draggableId, {
        status: newStatus,
        order: destination.index,
      });

      // 如果是同列排序，或者跨列排序导致目标列其他任务位置变化，
      // 我们需要批量更新目标列中受影响任务的 order
      // 为了保证一致性，我们对目标列中 index 发生变化的任务都进行一次同步
      const updatePromises = destColumnTasks
        .filter((t) => t.id !== draggableId) // 排除掉已经更新过的 movedTask
        .map((t, i) => {
          return pb.collection('kanban_tasks').update(t.id, { order: i });
        });

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      // 记录移动日志
      if (oldStatus !== newStatus) {
        const fromTitle = COLUMNS.find(c => c.id === oldStatus)?.title;
        const toTitle = COLUMNS.find(c => c.id === newStatus)?.title;
        const authData = pb.authStore.model;
        if (authData) {
          await pb.collection('kanban_logs').create({
            task: draggableId,
            content: `从 ${fromTitle} 移动到 ${toTitle}`,
            user: authData.id,
          });
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('更新任务排序失败');
      fetchTasks(); // 失败时回退到后端数据
    }
  };

  const handleAddTask = (status: KanbanTaskStatus = 'todo') => {
    setSelectedTask(undefined);
    setDefaultStatus(status);
    setIsDrawerOpen(true);
  };

  const handleEditTask = (task: KanbanTask) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleSaveTask = async () => {
    setIsDrawerOpen(false);
    fetchTasks();
  };

  const clearFilters = () => {
    setSearch('');
    setPriorityFilter('all');
    setTagFilters([]);
    setShowArchived(false);
  };

  const activeFilterCount = [
    search !== '',
    priorityFilter !== 'all',
    tagFilters.length > 0,
    showArchived === true
  ].filter(Boolean).length;

  if (loading && tasks.length === 0) {
    return <div className="flex h-full items-center justify-center">加载中...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-2xl font-bold">个人看板</h1>
          <p className="text-sm text-muted-foreground">管理你的日常任务和进度</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsTagManagerOpen(true)}>
            <TagIcon className="mr-2 h-4 w-4" />
            标签管理
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <FunnelIcon className="mr-2 h-4 w-4" />
                筛选
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-blue-500 hover:bg-blue-600">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">筛选任务</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs text-muted-foreground">
                      清除全部
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">搜索</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索任务标题..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-2.5"
                      >
                        <XMarkIcon className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">优先级</label>
                  <Select value={priorityFilter} onValueChange={(val: any) => setPriorityFilter(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="全部优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部优先级</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">标签筛选</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map(tag => {
                      const isSelected = tagFilters.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            setTagFilters(prev =>
                              isSelected
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border transition-all duration-200",
                            isSelected
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-900/30"
                              : "bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-neutral-900/50 dark:border-neutral-800 dark:text-neutral-400 hover:border-neutral-300"
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                          <span className="font-medium">{tag.name}</span>
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 ml-0.5 animate-in zoom-in duration-200" />
                          )}
                        </button>
                      );
                    })}
                    {tags.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">暂无可用标签</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Checkbox
                    id="show-archived"
                    checked={showArchived}
                    onCheckedChange={(checked: boolean) => setShowArchived(checked)}
                  />
                  <label htmlFor="show-archived" className="text-xs font-medium cursor-pointer">
                    查看已归档任务
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" onClick={() => handleAddTask()}>
            <PlusIcon className="mr-2 h-4 w-4" />
            添加任务
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto p-6 pt-0">
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex flex-col w-80 bg-neutral-100/50 dark:bg-neutral-900/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    {column.title}
                    <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs px-2 py-0.5 rounded-full">
                      {tasks.filter((t) => t.status === column.id).length}
                    </span>
                  </h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddTask(column.id)}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 space-y-3 min-h-[100px] transition-colors rounded-xl p-1"
                      )}
                    >
                      {tasks.filter((task) => task.status === column.id).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400">
                          <p className="text-xs">暂无任务</p>
                        </div>
                      )}
                      {tasks
                        .filter((task) => task.status === column.id)
                        .map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <KanbanCard
                                  task={task}
                                  onClick={() => handleEditTask(task)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      <TaskFormDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        task={selectedTask}
        tags={tags}
        defaultStatus={defaultStatus}
        onSave={handleSaveTask}
        onManageTags={() => setIsTagManagerOpen(true)}
      />

      <TagManager
        open={isTagManagerOpen}
        onOpenChange={setIsTagManagerOpen}
        tags={tags}
        onRefresh={fetchTasks}
      />
    </div>
  );
}
