import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    FlagIcon,
    ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import type { Objective, Kr, Task } from '../types';
import { pb } from '@/lib/pocketbase';

interface OkrListViewProps {
    objectives: Objective[];
    krs: Kr[];
    tasks: Task[];
    onEditObjective: (obj: Objective) => void;
    onEditKr: (kr: Kr) => void;
    onEditTask: (task: Task) => void;
    onAddObjective: () => void;
    onAddKrWithObjective: (objId: string) => void;
    onAddTask: () => void;
    onAddTaskWithKr: (krId: string) => void;
    onRefresh: () => void;
}

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

export const OkrListView: React.FC<OkrListViewProps> = ({
    objectives,
    krs,
    tasks,
    onEditObjective,
    onEditKr,
    onEditTask,
    onAddObjective,
    onAddKrWithObjective,
    onAddTask,
    onAddTaskWithKr,
    onRefresh,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* 目标与关键结果 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FlagIcon className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold">目标与关键结果</h2>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={onAddObjective} className="rounded-xl">
                            <PlusIcon className="mr-2 h-4 w-4" /> 添加目标
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {objectives.map((obj) => (
                        <Card key={obj.id} className="rounded-2xl overflow-hidden !p-0 !gap-y-0">
                            <CardHeader className="bg-neutral-50 dark:bg-neutral-900/50 py-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-base">{obj.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                        title="添加关键结果"
                                        onClick={() => onAddKrWithObjective(obj.id)}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditObjective(obj)}>
                                        <PencilSquareIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={async () => {
                                        if (confirm('确认删除该目标？')) {
                                            await pb.collection('okr_objectives').delete(obj.id);
                                            onRefresh();
                                        }
                                    }}>
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="!p-4">
                                <div className="space-y-4">
                                    {krs.filter(kr => kr.objectives.includes(obj.id)).map(kr => (
                                        <div key={kr.id} className="flex flex-col gap-2 rounded-xl border p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/30">
                                            <div className="flex items-start justify-between gap-4">
                                                <span className="text-sm">{kr.name}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-sm text-neutral-500 whitespace-nowrap">
                                                        {kr.current_value} / {kr.target_value} {kr.unit}
                                                    </span>
                                                    <div className="flex">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                            title="添加任务"
                                                            onClick={() => onAddTaskWithKr(kr.id)}
                                                        >
                                                            <PlusIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditKr(kr)}>
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={async () => {
                                                            if (confirm('确认删除该关键结果？')) {
                                                                await pb.collection('okr_krs').delete(kr.id);
                                                                onRefresh();
                                                            }
                                                        }}>
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <Progress value={(kr.current_value / kr.target_value) * 100} className="h-1" />
                                        </div>
                                    ))}
                                    {krs.filter(kr => kr.objectives.includes(obj.id)).length === 0 && (
                                        <p className="text-sm text-neutral-400 text-center py-4">暂无关键结果</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* 任务统计 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold">任务</h2>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={onAddTask} className="rounded-xl">
                            <PlusIcon className="mr-2 h-4 w-4" /> 添加任务
                        </Button>
                    </div>
                </div>
                <Card className="rounded-2xl !p-0">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium">任务名称</th>
                                        <th className="px-6 py-3 text-left font-medium">关联 KR</th>
                                        <th className="px-6 py-3 text-left font-medium">优先级</th>
                                        <th className="px-6 py-3 text-left font-medium">状态</th>
                                        <th className="px-6 py-3 text-right font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {[...tasks].sort((a, b) => (PRIORITY_ORDER[b.priority] || PRIORITY_ORDER['中']) - (PRIORITY_ORDER[a.priority] || PRIORITY_ORDER['中'])).map((task) => (
                                        <tr key={task.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{task.name}</span>
                                                    {task.notes && (
                                                        <span className="text-xs text-neutral-400 mt-1 line-clamp-1" title={task.notes}>
                                                            {task.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {krs.find(k => k.id === task.kr)?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`rounded-lg border font-normal ${getPriorityColor(task.priority || '中')}`}>
                                                    {task.priority || '中'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={task.status === '已完成' ? 'default' : 'outline'} className="rounded-lg">
                                                    {task.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditTask(task)}>
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={async () => {
                                                        if (confirm('确认删除该任务？')) {
                                                            await pb.collection('okr_tasks').delete(task.id);
                                                            onRefresh();
                                                        }
                                                    }}>
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {tasks.length === 0 && (
                            <div className="py-8 text-center text-neutral-400">暂无任务</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
