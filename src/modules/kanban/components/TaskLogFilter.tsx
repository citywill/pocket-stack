import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import type { KanbanTag } from '../types';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskLogFilterProps {
    keyword: string;
    setKeyword: (value: string) => void;
    selectedTag: string;
    setSelectedTag: (value: string) => void;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;
    tags: KanbanTag[];
    onSearch: () => void;
    logStats: Record<string, number>;
    onMonthChange: (date: Date) => void;
}

export function TaskLogFilter({
    keyword,
    setKeyword,
    selectedTag,
    setSelectedTag,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    tags,
    onSearch,
    logStats,
    onMonthChange
}: TaskLogFilterProps) {
    const selectedRange = {
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined
    };

    return (
        <Card className="w-80 h-full flex-shrink-0 flex flex-col !p-0">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* 关键词搜索 */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">关键词</label>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="搜索内容或任务标题..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="pl-9"
                            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                        />
                    </div>
                </div>

                {/* 日期筛选 (热力图) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">日期筛选</label>
                    <div className="rounded-md p-2 bg-white flex justify-center">
                        <Calendar
                            mode="range"
                            selected={selectedRange}
                            onSelect={(range) => {
                                setStartDate(range?.from ? format(range.from, 'yyyy-MM-dd') : '');
                                setEndDate(range?.to ? format(range.to, 'yyyy-MM-dd') : '');
                            }}
                            locale={zhCN}
                            onMonthChange={onMonthChange}
                            modifiers={{
                                level1: (date) => {
                                    const c = logStats[format(date, 'yyyy-MM-dd')] || 0;
                                    return c > 0 && c < 3;
                                },
                                level2: (date) => {
                                    const c = logStats[format(date, 'yyyy-MM-dd')] || 0;
                                    return c >= 3 && c < 6;
                                },
                                level3: (date) => {
                                    const c = logStats[format(date, 'yyyy-MM-dd')] || 0;
                                    return c >= 6;
                                },
                            }}
                            modifiersClassNames={{
                                level1: 'bg-blue-100 text-blue-900 font-medium hover:bg-blue-200',
                                level2: 'bg-blue-300 text-blue-900 font-medium hover:bg-blue-400',
                                level3: 'bg-blue-500 text-white font-medium hover:bg-blue-600',
                            }}
                            className="rounded-md border-0"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <div className="text-xs text-gray-500 text-center">
                            已选: {startDate} {endDate && endDate !== startDate ? `至 ${endDate}` : ''}
                        </div>
                    )}
                </div>

                {/* 标签筛选 */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">标签</label>
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={selectedTag === 'all' ? "default" : "outline"}
                            onClick={() => setSelectedTag('all')}
                            className={`cursor-pointer px-3 py-1 text-xs h-7 ${selectedTag === 'all'
                                ? "bg-blue-600 hover:bg-blue-700 border-transparent"
                                : "hover:bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                        >
                            全部
                        </Badge>
                        {tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="outline"
                                onClick={() => setSelectedTag(tag.id)}
                                className={`cursor-pointer px-3 py-1 text-xs h-7 flex items-center gap-1.5 ${selectedTag === tag.id
                                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    : "hover:bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                            >
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: tag.color || '#94a3b8' }}
                                />
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

