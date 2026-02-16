import { useState, useEffect, useCallback, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { KanbanLog, KanbanTag } from './types';
import { toast } from 'sonner';
import { TaskLogFilter } from './components/TaskLogFilter';
import { AiDialog } from './components/AiDialog';

const ITEMS_PER_PAGE = 20;

export default function TaskLogPage() {
    const [logs, setLogs] = useState<KanbanLog[]>([]);
    const [tags, setTags] = useState<KanbanTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Stats for heatmap
    const [logStats, setLogStats] = useState<Record<string, number>>({});
    const loadedMonths = useRef<Set<string>>(new Set());

    const fetchTags = useCallback(async () => {
        try {
            const records = await pb.collection('kanban_tags').getFullList<KanbanTag>({
                sort: 'name',
            });
            setTags(records);
        } catch (error: any) {
            if (!error.isAbort) {
                console.error('Failed to fetch tags:', error);
                toast.error('加载标签失败');
            }
        }
    }, []);

    const fetchLogStats = useCallback(async (month: Date) => {
        const monthKey = format(month, 'yyyy-MM');
        if (loadedMonths.current.has(monthKey)) {
            return;
        }

        try {
            const start = startOfMonth(month);
            const end = endOfMonth(month);
            // PocketBase filter format
            const startStr = format(start, 'yyyy-MM-dd 00:00:00');
            const endStr = format(end, 'yyyy-MM-dd 23:59:59');

            const records = await pb.collection('kanban_logs').getFullList({
                filter: `created >= "${startStr}" && created <= "${endStr}"`,
                fields: 'created',
                requestKey: null // Avoid auto-cancellation
            });

            const newStats: Record<string, number> = {};
            records.forEach((record: any) => {
                const date = format(new Date(record.created), 'yyyy-MM-dd');
                newStats[date] = (newStats[date] || 0) + 1;
            });

            setLogStats(prev => {
                // Merge with previous stats
                const merged = { ...prev };
                Object.entries(newStats).forEach(([date, count]) => {
                    merged[date] = count;
                });
                return merged;
            });

            loadedMonths.current.add(monthKey);
        } catch (error) {
            console.error('Failed to fetch log stats:', error);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const filters = [];

            // 关键词过滤 (搜索日志内容或关联的任务标题)
            if (keyword.trim()) {
                filters.push(`(content ~ "${keyword}" || task.title ~ "${keyword}")`);
            }

            // 标签过滤 (关联任务的标签)
            if (selectedTag && selectedTag !== 'all') {
                filters.push(`task.tags ?~ "${selectedTag}"`);
            }

            // 日期过滤 (创建时间)
            if (startDate) {
                filters.push(`created >= "${startDate} 00:00:00"`);
            }
            if (endDate) {
                filters.push(`created <= "${endDate} 23:59:59"`);
            }

            const result = await pb.collection('kanban_logs').getList<KanbanLog>(page, ITEMS_PER_PAGE, {
                sort: '-created',
                filter: filters.length > 0 ? filters.join(' && ') : '',
                expand: 'task,task.tags',
            });

            setLogs(result.items);
            setTotalPages(result.totalPages);
            setTotalItems(result.totalItems);
        } catch (error: any) {
            if (!error.isAbort) {
                console.error('Failed to fetch logs:', error);
                toast.error('加载日志失败');
            }
        } finally {
            setLoading(false);
        }
    }, [page, keyword, selectedTag, startDate, endDate]);

    useEffect(() => {
        fetchTags();
        fetchLogStats(new Date());
    }, [fetchTags, fetchLogStats]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleReset = () => {
        setKeyword('');
        setSelectedTag('all');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const handleSearch = () => {
        setPage(1);
        fetchLogs();
    };

    return (
        <div className="flex flex-col bg-gray-50/50">
            {/* 页面头部 */}
            <div className="p-6 pb-0 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">任务日志</h1>
                    <p className="text-sm text-gray-500">查看和筛选任务的操作记录、评论和变更历史</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} className="text-gray-600">
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        重置筛选
                    </Button>
                    {logs.length > 0 && (
                        <AiDialog
                            logs={logs}
                            title={
                                startDate && endDate
                                    ? `${startDate} 至 ${endDate} 任务日志`
                                    : startDate
                                        ? `${startDate} 之后任务日志`
                                        : endDate
                                            ? `${endDate} 之前任务日志`
                                            : "任务日志列表"
                            }
                        />
                    )}
                </div>
            </div>

            <div className="flex flex-1 gap-4 p-6 overflow-hidden">
                {/* 左侧过滤栏 */}
                <TaskLogFilter
                    keyword={keyword}
                    setKeyword={setKeyword}
                    selectedTag={selectedTag}
                    setSelectedTag={setSelectedTag}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    tags={tags}
                    onSearch={handleSearch}
                    logStats={logStats}
                    onMonthChange={fetchLogStats}
                />

                {/* 右侧列表 */}
                <Card className="flex-1 h-full flex flex-col min-w-0 gap-0 p-0">
                    <CardHeader className="p-4 !pb-4 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">日志列表</CardTitle>
                        <div className="text-sm text-gray-500">
                            共找到 {totalItems} 条记录
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 overflow-auto bg-gray-50/50">
                        {loading ? (
                            <div className="flex justify-center items-center h-40 text-gray-500">
                                加载中...
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex justify-center items-center h-40 text-gray-500">
                                暂无日志记录
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">
                                                    {format(new Date(log.created), 'yyyy-MM-dd HH:mm:ss')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            {log.expand?.task ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-gray-900">
                                                        {log.expand.task.title}
                                                    </span>
                                                    {log.expand.task.expand?.tags && log.expand.task.expand.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {log.expand.task.expand.tags.map((tag: KanbanTag) => (
                                                                <Badge
                                                                    key={tag.id}
                                                                    variant="secondary"
                                                                    className="text-[10px] px-1.5 py-0 h-5"
                                                                    style={{
                                                                        backgroundColor: `${tag.color}20`,
                                                                        color: tag.color,
                                                                        borderColor: `${tag.color}40`,
                                                                    }}
                                                                >
                                                                    {tag.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">任务已删除</span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap border border-gray-100">
                                            {log.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {/* 分页 */}
                    <div className="p-4 border-t flex items-center justify-between bg-white">
                        <div className="text-sm text-gray-500">
                            第 {page} / {totalPages || 1} 页
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                上一页
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading || totalPages === 0}
                            >
                                下一页
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
