import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    startOfDay,
    endOfDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    ArrowLeft01Icon,
    ArrowRight01Icon,
    Bookmark01Icon,
    HourglassIcon,
    CheckmarkCircle01Icon,
    Add01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TaskForm, type Task } from '@/components/tasks/TaskForm';

const statusMap = {
    todo: {
        label: '待办',
        color: 'bg-neutral-50 text-neutral-600 border-neutral-100 dark:bg-neutral-900/20 dark:text-neutral-400 dark:border-neutral-800',
        icon: Bookmark01Icon
    },
    in_progress: {
        label: '进行中',
        color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        icon: HourglassIcon
    },
    completed: {
        label: '已完成',
        color: 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        icon: CheckmarkCircle01Icon
    },
};

const priorityColorMap = {
    low: 'bg-neutral-400',
    medium: 'bg-blue-500',
    high: 'bg-red-500',
};

const TaskItem = ({ task, onClick }: { task: Task; onClick: () => void }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={cn(
            "text-left text-[10px] md:text-[11px] px-2 py-1 rounded-md border shadow-[0_1px_2px_rgba(0,0,0,0.02)] truncate flex items-center gap-1.5 transition-all hover:translate-x-0.5 hover:shadow-md w-full",
            statusMap[task.status].color
        )}
        title={`${task.title} (${statusMap[task.status].label})`}
    >
        <HugeiconsIcon
            icon={statusMap[task.status].icon}
            size={10}
            className="shrink-0"
        />
        <span className="truncate font-medium">{task.title}</span>
    </button>
);

export function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const { monthStart, startDate, endDate, calendarDays } = useMemo(() => {
        const mStart = startOfMonth(currentDate);
        const mEnd = endOfMonth(mStart);
        const sDate = startOfWeek(mStart, { weekStartsOn: 1 });
        const eDate = endOfWeek(mEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: sDate, end: eDate });
        return { monthStart: mStart, startDate: sDate, endDate: eDate, calendarDays: days };
    }, [currentDate]);

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const startStr = startOfDay(startDate).toISOString().replace('T', ' ').split('.')[0];
            const endStr = endOfDay(endDate).toISOString().replace('T', ' ').split('.')[0];

            const records = await pb.collection('tasks').getFullList<Task>({
                filter: `user = "${user.id}" && created >= "${startStr}" && created <= "${endStr}"`,
                sort: 'created',
            });
            setTasks(records);
        } catch (error: any) {
            // Silence autocancellation errors
            if (error?.isAbort) return;
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [user, startDate, endDate]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const tasksByDay = useMemo(() => {
        const map: Record<string, Task[]> = {};
        tasks.forEach(task => {
            // Use local date for grouping to match the calendar display
            const dateKey = format(parseISO(task.created), 'yyyy-MM-dd');
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(task);
        });
        return map;
    }, [tasks]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const handleCreateTask = () => {
        setEditingTask(null);
        setIsFormOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6 transition-all duration-500 ease-in-out">
            {/* 页面头部 - 与任务管理统一 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
                        任务日历
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        从时间维度掌控您的工作节奏，不错过任何重要瞬间
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* 日历导航组 */}
                    <div className="flex items-center bg-white dark:bg-neutral-950 rounded-2xl p-1 border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-600 dark:text-neutral-400"
                                onClick={prevMonth}
                            >
                                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-8 rounded-xl px-3 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-700 dark:text-neutral-300"
                                onClick={goToToday}
                            >
                                今天
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-600 dark:text-neutral-400"
                                onClick={nextMonth}
                            >
                                <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mx-2 h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />
                        <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 min-w-[110px] text-center px-2">
                            {format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}
                        </h2>
                    </div>

                    <Button
                        onClick={handleCreateTask}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-10 px-5 shadow-lg shadow-blue-500/20 transition-all active:scale-95 font-bold"
                    >
                        <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4 stroke-2" />
                        新建任务
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden flex flex-col border-1 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 rounded-2xl">
                <div className="grid grid-cols-7 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
                        <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-wider text-neutral-400">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr">
                    {calendarDays.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayTasks = tasksByDay[dateKey] || [];
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, monthStart);

                        return (
                            <div
                                key={dateKey}
                                className={cn(
                                    "min-h-28 md:min-h-36 border-r border-b border-neutral-100 dark:border-neutral-800 p-2 flex flex-col gap-1 transition-colors group",
                                    !isCurrentMonth && "bg-neutral-50/30 dark:bg-neutral-900/20 opacity-60",
                                    isToday && "bg-blue-50/30 dark:bg-blue-900/10",
                                    idx % 7 === 6 && "border-r-0",
                                    "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                        isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none scale-110" : "text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-100",
                                        !isCurrentMonth && "opacity-50"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayTasks.length > 0 && (
                                        <div className="flex -space-x-1 overflow-hidden">
                                            {dayTasks.slice(0, 3).map((task) => (
                                                <div
                                                    key={task.id}
                                                    className={cn("w-1.5 h-1.5 rounded-full border border-white dark:border-neutral-900", priorityColorMap[task.priority])}
                                                />
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <span className="text-[9px] font-bold text-muted-foreground ml-1">+{dayTasks.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 overflow-hidden flex-1">
                                    {dayTasks.slice(0, 3).map((task) => (
                                        <TaskItem key={task.id} task={task} onClick={() => handleEditTask(task)} />
                                    ))}

                                    {dayTasks.length > 3 && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[10px] md:text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors w-full text-center mt-auto"
                                                >
                                                    还有 {dayTasks.length - 3} 项...
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-2 rounded-xl shadow-xl border-neutral-200 dark:border-neutral-800" align="start">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="px-2 py-1 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                                                        <span className="text-xs font-bold text-neutral-500">
                                                            {format(day, 'MM月dd日')} 的所有任务
                                                        </span>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto no-scrollbar flex flex-col gap-1">
                                                        {dayTasks.map((task) => (
                                                            <TaskItem key={task.id} task={task} onClick={() => handleEditTask(task)} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <TaskForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => fetchTasks()}
                task={editingTask}
            />
        </div>
    );
}

export default CalendarPage;
