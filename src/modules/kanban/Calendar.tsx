import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import type { KanbanLog, KanbanTag } from './types';
import { ClientResponseError } from 'pocketbase';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { format, isSameDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { SummaryDialog } from './components/SummaryDialog';

export default function KanbanCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [logs, setLogs] = useState<KanbanLog[]>([]);
    const [tags, setTags] = useState<KanbanTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [datesWithLogs, setDatesWithLogs] = useState<Date[]>([]);

    const fetchTags = useCallback(async () => {
        try {
            const allTags = await pb.collection('kanban_tags').getFullList<KanbanTag>({
                sort: 'name',
                requestKey: 'kanban_calendar_tags', // 使用固定 requestKey 避免 autocancel
            });
            setTags(allTags);
        } catch (error) {
            // 忽略由于组件卸载或新请求导致的取消错误
            if (error instanceof ClientResponseError && error.isAbort) {
                return;
            }
            console.error('Failed to fetch tags:', error);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            // 获取所有日志以在日历上标记
            const allLogs = await pb.collection('kanban_logs').getFullList<KanbanLog>({
                sort: '-created',
                expand: 'task,task.tags',
                requestKey: 'kanban_calendar_logs', // 使用固定 requestKey 避免 autocancel
            });
            setLogs(allLogs);

            // 提取有日志的日期
            const dates = allLogs.map(log => parseISO(log.created));
            setDatesWithLogs(dates);
        } catch (error) {
            // 忽略由于组件卸载或新请求导致的取消错误
            if (error instanceof ClientResponseError && error.isAbort) {
                return;
            }
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchTags();
    }, [fetchLogs, fetchTags]);

    // 过滤出选中日期的日志
    const selectedDateLogs = logs.filter(log =>
        date && isSameDay(parseISO(log.created), date)
    );

    return (
        <div className="flex flex-col h-full overflow-hidden p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">任务日历</h1>
                <p className="text-sm text-muted-foreground">查看每日任务动态和操作记录</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                {/* 左侧日历 - 固定宽度 */}
                <div className="w-full md:w-[320px] flex-shrink-0">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <CalendarIcon className="mr-2 h-5 w-5 text-blue-500" />
                                选择日期
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-0 pb-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={zhCN}
                                className="rounded-md border-none"
                                modifiers={{
                                    hasLog: datesWithLogs
                                }}
                                modifiersClassNames={{
                                    hasLog: "bg-blue-50 text-blue-600 font-bold hover:bg-blue-100"
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* 右侧日志列表 - 自适应剩余宽度 */}
                <div className="flex-1 min-w-0">
                    <Card className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center text-lg">
                                <ClipboardDocumentListIcon className="mr-2 h-5 w-5 text-blue-500" />
                                {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '未选择日期'} 的日志
                                <Badge variant="secondary" className="rounded-full ml-4">
                                    {selectedDateLogs.length} 条记录
                                </Badge>
                            </CardTitle>
                            <div className="flex items-center">
                                {date && selectedDateLogs.length > 0 && (
                                    <SummaryDialog
                                        logs={selectedDateLogs}
                                        allTags={tags}
                                        date={date}
                                    />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-0">
                            <ScrollArea className="h-full px-6">
                                {loading ? (
                                    <div className="flex justify-center py-8 text-muted-foreground">加载中...</div>
                                ) : selectedDateLogs.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedDateLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="group relative flex flex-col space-y-2 p-4 rounded-2xl border bg-card hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-sm leading-none">
                                                            {log.expand?.task?.title || '未知任务'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {log.content}
                                                        </p>
                                                    </div>
                                                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {format(parseISO(log.created), 'HH:mm')}
                                                    </time>
                                                </div>
                                                {log.remark && (
                                                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg italic">
                                                        备注: {log.remark}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
                                        <ClipboardDocumentListIcon className="h-12 w-12 opacity-20" />
                                        <p>当天没有任务日志</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
