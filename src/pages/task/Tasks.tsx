import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Task01Icon,
  Add01Icon,
  RefreshIcon,
  Search01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  Bookmark01Icon,
  CheckmarkCircle01Icon,
  HourglassIcon,
  MoreHorizontalIcon,
  Calendar01Icon,
  ArrowUpDownIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArchiveIcon,
  LayoutGridIcon,
  Table01Icon,
  DragDropVerticalIcon,
  MaximizeIcon,
  Minimize01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { TaskForm, type Task } from '@/pages/task/components/TaskForm';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusMap = {
  todo: { label: '待办', color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', icon: Bookmark01Icon },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', icon: HourglassIcon },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400', icon: CheckmarkCircle01Icon },
};

const priorityMap = {
  low: { label: '低', color: 'text-neutral-500' },
  medium: { label: '中', color: 'text-blue-500' },
  high: { label: '高', color: 'text-red-500' },
};

export function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('tasks-sort-pref') || 'sort_order');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(() => (localStorage.getItem('tasks-view-mode') as 'table' | 'kanban') || 'table');

  useEffect(() => {
    localStorage.setItem('tasks-sort-pref', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('tasks-view-mode', viewMode);
  }, [viewMode]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const filters: string[] = [
      `user = "${user.id}"`,
      `archived = ${showArchived}`
    ];

    try {
      if (searchTerm) {
        filters.push(`(title ~ "${searchTerm}" || description ~ "${searchTerm}")`);
      }

      if (filterStatus !== 'all') {
        filters.push(`status = "${filterStatus}"`);
      }

      if (filterPriority !== 'all') {
        filters.push(`priority = "${filterPriority}"`);
      }

      if (filterTime !== 'all') {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0); // Start from midnight

        if (filterTime === 'week') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (filterTime === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
        }

        const formattedDate = startDate.toISOString().replace('T', ' ').split('.')[0];
        filters.push(`created >= "${formattedDate}"`);
      }

      const filterString = filters.join(' && ');

      if (viewMode === 'kanban') {
        const result = await pb.collection('tasks').getFullList<Task>({
          sort: sortBy,
          filter: filterString,
        });
        setTasks(result);
        setTotalItems(result.length);
        setTotalPages(1);
      } else {
        const result = await pb.collection('tasks').getList<Task>(page, perPage, {
          sort: sortBy,
          filter: filterString,
        });
        setTasks(result.items);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      }
    } catch (error: any) {
      if (error.isAbort) return;
      console.error('Failed to fetch tasks:', error);
      try {
        const result = await pb.collection('tasks').getList<Task>(1, 50, {
          filter: filters.join(' && '),
        });
        setTasks(result.items);
      } catch (innerError: any) {
        if (!innerError.isAbort) {
          console.error('Critical fetch failure:', innerError);
        }
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortBy(`-${field}`);
    } else if (sortBy === `-${field}`) {
      setSortBy(field);
    } else {
      // Default to descending for dates/priority, ascending for text
      if (field === 'title') {
        setSortBy(field);
      } else {
        setSortBy(`-${field}`);
      }
    }
  };

  const getSortIcon = (field: string) => {
    const isSorted = sortBy === field || sortBy === `-${field}`;
    const isDesc = sortBy === `-${field}`;

    if (!isSorted) {
      return <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-1.5 h-3.5 w-3.5 opacity-20 group-hover:opacity-50 transition-opacity" />;
    }

    return isDesc
      ? <HugeiconsIcon icon={ArrowDown01Icon} className="ml-1.5 h-3.5 w-3.5 text-blue-500" />
      : <HugeiconsIcon icon={ArrowUp01Icon} className="ml-1.5 h-3.5 w-3.5 text-blue-500" />;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortBy, searchTerm, filterStatus, filterPriority, filterTime, showArchived, viewMode, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterPriority, filterTime, showArchived, viewMode]);

  const handleOpenDialog = (task?: Task) => {
    setEditingTask(task || null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除个任务吗？')) {
      try {
        await pb.collection('tasks').delete(id);
        fetchTasks();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const toggleArchive = async (task: Task) => {
    try {
      await pb.collection('tasks').update(task.id, { archived: !task.archived });
      fetchTasks();
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  const updateStatus = async (task: Task, newStatus: Task['status']) => {
    try {
      await pb.collection('tasks').update(task.id, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Get all tasks in the destination column, sorted by their current sort_order
    const destinationStatus = destination.droppableId as Task['status'];
    const columnTasks = tasks
      .filter(t => t.status === destinationStatus)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Calculate new sort_order
    let newSortOrder: number;

    if (columnTasks.length === 0) {
      // Column is empty
      newSortOrder = 1000;
    } else if (destination.index === 0) {
      // Moved to top
      newSortOrder = (columnTasks[0].sort_order || 0) / 2;
    } else if (destination.index >= columnTasks.length) {
      // Moved to bottom (handling cross-column move where length doesn't include the incoming task yet)
      newSortOrder = (columnTasks[columnTasks.length - 1].sort_order || 0) + 1000;
    } else {
      // Re-fetch current items in the target column (excluding the one being dragged if it's the same column)
      const sameColumn = source.droppableId === destination.droppableId;
      const filtered = tasks
        .filter(t => t.status === destinationStatus && (sameColumn ? t.id !== draggableId : true))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      if (destination.index === 0) {
        newSortOrder = (filtered[0]?.sort_order || 1000) / 2;
      } else if (destination.index >= filtered.length) {
        newSortOrder = (filtered[filtered.length - 1]?.sort_order || 0) + 1000;
      } else {
        const prev = filtered[destination.index - 1];
        const next = filtered[destination.index];
        newSortOrder = ((prev.sort_order || 0) + (next.sort_order || 0)) / 2;
      }
    }

    // Optimistically update local state
    const updatedTasks = tasks.map(t =>
      t.id === draggableId ? { ...t, status: destinationStatus, sort_order: newSortOrder } : t
    ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    setTasks(updatedTasks);

    try {
      await pb.collection('tasks').update(draggableId, {
        status: destinationStatus,
        sort_order: newSortOrder
      });
    } catch (error) {
      console.error('Failed to update task position via drag:', error);
      fetchTasks(); // Revert on failure
    }
  };

  return (
    <div className={cn(
      "space-y-6 transition-all duration-500 ease-in-out",
      isFullscreen && "fixed inset-0 z-[40] bg-white dark:bg-neutral-950 p-8 overflow-y-auto m-0 !max-w-none"
    )}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            任务管理
          </h1>
          <p className="mt-1.5 text-neutral-500 dark:text-neutral-400">
            高效管理您的个人待办事项与工作项
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "rounded-2xl transition-all active:scale-95 border-neutral-200 dark:border-neutral-800",
              isFullscreen ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white dark:bg-neutral-950 text-neutral-600"
            )}
            title={isFullscreen ? "退出全屏" : "全屏模式"}
          >
            <HugeiconsIcon icon={isFullscreen ? Minimize01Icon : MaximizeIcon} className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}
            className="rounded-2xl transition-all bg-white dark:bg-neutral-950 text-neutral-600 border-neutral-200 dark:border-neutral-800 active:scale-95"
            title={viewMode === 'table' ? "切换至看板模式" : "切换至表格视图"}
          >
            <HugeiconsIcon
              icon={viewMode === 'table' ? LayoutGridIcon : Table01Icon}
              className="h-4 w-4"
            />
          </Button>
          <Button variant="outline" size="icon" onClick={() => fetchTasks()} disabled={loading} className="rounded-2xl bg-white dark:bg-neutral-950 transition-all active:scale-95">
            <HugeiconsIcon icon={RefreshIcon} className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-blue-500/20 transition-all active:scale-95" onClick={() => handleOpenDialog()}>
            <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
            新建任务
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[240px] flex-1 max-w-md">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="搜索任务..."
              className="pl-9 bg-white dark:bg-neutral-950 h-9 border-neutral-200 dark:border-neutral-800 rounded-xl focus-visible:ring-blue-500/20 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-9 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-medium">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800 p-1 shadow-lg">
              <SelectItem value="all" className="rounded-lg py-1.5 text-xs">所有状态</SelectItem>
              <SelectItem value="todo" className="rounded-lg py-1.5 text-xs">待办</SelectItem>
              <SelectItem value="in_progress" className="rounded-lg py-1.5 text-xs">进行中</SelectItem>
              <SelectItem value="completed" className="rounded-lg py-1.5 text-xs">已完成</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40 h-9 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-medium">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800 p-1 shadow-lg">
              <SelectItem value="all" className="rounded-lg py-1.5 text-xs">所有优先级</SelectItem>
              <SelectItem value="low" className="rounded-lg py-1.5 text-xs">低</SelectItem>
              <SelectItem value="medium" className="rounded-lg py-1.5 text-xs">中</SelectItem>
              <SelectItem value="high" className="rounded-lg py-1.5 text-xs">高</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-40 h-9 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-medium">
              <SelectValue placeholder="时间" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800 p-1 shadow-lg">
              <SelectItem value="all" className="rounded-lg py-1.5 text-xs">不限时间</SelectItem>
              <SelectItem value="today" className="rounded-lg py-1.5 text-xs">今天</SelectItem>
              <SelectItem value="week" className="rounded-lg py-1.5 text-xs">最近7天</SelectItem>
              <SelectItem value="month" className="rounded-lg py-1.5 text-xs">最近30天</SelectItem>
            </SelectContent>
          </Select>

          {(filterStatus !== 'all' || filterPriority !== 'all' || filterTime !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus('all');
                setFilterPriority('all');
                setFilterTime('all');
              }}
              className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold transition-colors"
            >
              清除
            </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "h-9 px-3 gap-2 rounded-xl text-xs font-bold transition-all border border-transparent shrink-0",
              showArchived
                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            )}
          >
            <HugeiconsIcon icon={ArchiveIcon} className="h-3.5 w-3.5" />
            {showArchived ? "活跃中" : "归档箱"}
          </Button>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-96">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50/50 dark:bg-neutral-950/50 border-b border-neutral-100 dark:border-neutral-800 hover:bg-transparent">
                  <TableHead
                    className="w-[40%] h-14 px-6 font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      任务详情
                      {getSortIcon('title')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[15%] h-14 font-bold text-neutral-900 dark:text-neutral-100 text-center cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center">
                      状态
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[15%] h-14 font-bold text-neutral-900 dark:text-neutral-100 text-center cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center justify-center">
                      优先级
                      {getSortIcon('priority')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[15%] h-14 font-bold text-neutral-900 dark:text-neutral-100 text-center cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    onClick={() => handleSort('updated')}
                  >
                    <div className="flex items-center justify-center">
                      最近更新
                      {getSortIcon('updated')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[15%] h-14 px-6 text-right font-bold text-neutral-900 dark:text-neutral-100 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center border-none">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="p-5 rounded-full bg-blue-50 dark:bg-blue-900/10 animate-fade-in">
                          <HugeiconsIcon icon={Task01Icon} className="h-10 w-10 text-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">暂待办事项</p>
                          <p className="text-sm text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
                            每一项伟大的成就都始于一个微小的任务。现在就开始规划您的蓝图吧。
                          </p>
                        </div>
                        <Button onClick={() => handleOpenDialog()} className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl px-8 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                          立即创建任务
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 border-b border-neutral-100 dark:border-neutral-800 last:border-0 transition-colors duration-200">
                      <TableCell className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 font-medium">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-lg text-[11px] px-2.5 py-0.5 border-none font-bold uppercase tracking-tight inline-flex items-center",
                          statusMap[task.status].color
                        )}>
                          <HugeiconsIcon icon={statusMap[task.status].icon} className="mr-1.5 h-3.5 w-3.5" />
                          {statusMap[task.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" :
                              task.priority === 'medium' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "bg-neutral-300"
                          )} />
                          <span className={cn("text-xs font-bold", priorityMap[task.priority].color)}>
                            {priorityMap[task.priority].label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 font-medium">
                          <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5" />
                          {task.updated ? new Date(task.updated).toLocaleDateString() : '尚未更新'}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all">
                              <HugeiconsIcon icon={MoreHorizontalIcon} className="h-5 w-5 text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-neutral-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <DropdownMenuLabel className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] px-3 py-2">
                              变更任务状态
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => updateStatus(task, 'todo')} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-neutral-50 dark:focus:bg-neutral-800 transition-colors text-sm font-medium">
                              <HugeiconsIcon icon={Bookmark01Icon} className="h-4 w-4 text-neutral-400" />
                              <span>设为待办</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(task, 'in_progress')} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-colors text-sm font-medium">
                              <HugeiconsIcon icon={HourglassIcon} className="h-4 w-4 text-blue-500" />
                              <span>推进中...</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(task, 'completed')} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-green-50 dark:focus:bg-green-900/20 transition-colors text-sm font-medium">
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-green-500" />
                              <span>完成任务!</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => toggleArchive(task)} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-amber-50 dark:focus:bg-amber-900/20 transition-colors text-sm font-medium">
                              <HugeiconsIcon icon={ArchiveIcon} className="h-4 w-4 text-amber-500" />
                              <span>{task.archived ? '取消归档' : '移入归档箱'}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-2 bg-neutral-100 dark:bg-neutral-800" />

                            <DropdownMenuLabel className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] px-3 py-2">
                              常规管理
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenDialog(task)} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-neutral-50 dark:focus:bg-neutral-800 transition-colors text-sm font-medium">
                              <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4 text-blue-600" />
                              <span>编辑详细内容</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(task.id)} className="rounded-xl gap-3 cursor-pointer py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 transition-colors text-sm font-medium">
                              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                              <span>永久移除</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-950/30">
              <div className="text-xs font-bold text-neutral-400">
                显示 {((page - 1) * perPage) + 1} - {Math.min(page * perPage, totalItems)} 条，共 {totalItems} 条
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-neutral-200 dark:border-neutral-800 disabled:opacity-30"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                        page === p
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                          : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      )}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-neutral-200 dark:border-neutral-800 disabled:opacity-30"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['todo', 'in_progress', 'completed'] as const).map((status) => (
              <div key={status} className="flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3">
                <div className="flex items-center justify-between px-3 mb-3 h-10">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full",
                      status === 'todo' ? "bg-neutral-400" :
                        status === 'in_progress' ? "bg-blue-500" : "bg-green-500"
                    )} />
                    <span className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      {statusMap[status].label}
                    </span>
                    <Badge variant="outline" className="h-5 px-1.5 min-w-[20px] justify-center ml-1 bg-white dark:bg-neutral-800 text-[10px] font-bold border-neutral-200 dark:border-neutral-800">
                      {tasks.filter(t => t.status === status).length}
                    </Badge>
                  </div>
                  {status === 'todo' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-blue-500 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors" onClick={() => handleOpenDialog()}>
                      <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex flex-col gap-3 min-h-[500px] p-2 rounded-2xl transition-all duration-200",
                        snapshot.isDraggingOver && "bg-blue-50/30 dark:bg-blue-900/10"
                      )}
                    >
                      {tasks.filter(t => t.status === status).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "group bg-white dark:bg-neutral-950 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all cursor-default",
                                snapshot.isDragging && "shadow-2xl border-blue-500 rotate-2 scale-105 z-50 pointer-events-none"
                              )}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                    <HugeiconsIcon icon={DragDropVerticalIcon} className="h-3.5 w-3.5 text-neutral-400" />
                                  </div>
                                  <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    task.priority === 'high' ? "bg-red-500" :
                                      task.priority === 'medium' ? "bg-blue-500" : "bg-neutral-300"
                                  )} />
                                  <h3 className="text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                                    {task.title}
                                  </h3>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-neutral-600 transition-colors">
                                      <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                                    <DropdownMenuItem onClick={() => handleOpenDialog(task)} className="rounded-lg gap-2.5 py-2 text-xs font-bold">
                                      <HugeiconsIcon icon={PencilEdit01Icon} className="h-3.5 w-3.5 text-blue-500" />
                                      编辑任务
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toggleArchive(task)} className="rounded-lg gap-2.5 py-2 text-xs font-bold">
                                      <HugeiconsIcon icon={ArchiveIcon} className="h-3.5 w-3.5 text-amber-500" />
                                      {task.archived ? '取消归档' : '移入归档箱'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem onClick={() => handleDelete(task.id)} className="rounded-lg gap-2.5 py-2 text-xs font-bold text-red-500">
                                      <HugeiconsIcon icon={Delete01Icon} className="h-3.5 w-3.5" />
                                      永久移除
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {task.description && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 font-medium leading-relaxed ml-9">
                                  {task.description}
                                </p>
                              )}
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
        </DragDropContext>
      )}

      <TaskForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => fetchTasks()}
        task={editingTask}
      />
    </div>
  );
}
