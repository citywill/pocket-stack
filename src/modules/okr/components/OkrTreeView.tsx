import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FlagIcon, TrophyIcon, ClipboardDocumentCheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Objective, Kr, Task } from '../types';

interface OkrTreeViewProps {
    objectives: Objective[];
    krs: Kr[];
    tasks: Task[];
    onAddKr?: (objId?: string) => void;
    onAddTask?: (krId?: string) => void;
}

export function OkrTreeView({ objectives, krs, tasks, onAddKr, onAddTask }: OkrTreeViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<JSX.Element[]>([]);

    const calculateLines = () => {
        if (!containerRef.current) return;

        const newLines: JSX.Element[] = [];
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();

        const getCenter = (id: string, type: 'obj' | 'kr' | 'task') => {
            const el = container.querySelector(`[data-id="${id}"][data-type="${type}"]`);
            if (!el) return null;
            const rect = el.getBoundingClientRect();

            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2,
                leftX: rect.left - containerRect.left,
                rightX: rect.right - containerRect.left,
                topY: rect.top - containerRect.top,
                bottomY: rect.bottom - containerRect.top
            };
        };

        const renderCurve = (x1: number, y1: number, x2: number, y2: number, color: string, key: string) => {
            const cp1x = x1 + (x2 - x1) / 2;
            const cp2x = x1 + (x2 - x1) / 2;

            return (
                <path
                    key={key}
                    d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                    stroke={color}
                    strokeWidth="1.5"
                    fill="none"
                    className="transition-all duration-300"
                />
            );
        };

        // 1. 目标 -> 关键结果
        krs.forEach((kr) => {
            const krPos = getCenter(kr.id, 'kr');
            if (!krPos) return;

            const objIds = Array.isArray(kr.objectives)
                ? kr.objectives
                : (kr.objectives ? [kr.objectives] : []);

            objIds.forEach((objId) => {
                const objPos = getCenter(objId, 'obj');
                if (!objPos) return;

                newLines.push(
                    renderCurve(
                        objPos.rightX,
                        objPos.y,
                        krPos.leftX,
                        krPos.y,
                        '#F97316',
                        `line-obj-kr-${objId}-${kr.id}`
                    )
                );
            });
        });

        // 2. 关键结果 -> 任务
        tasks.forEach((task) => {
            const taskPos = getCenter(task.id, 'task');
            if (!taskPos || !task.kr) return;

            const krPos = getCenter(task.kr, 'kr');
            if (!krPos) return;

            newLines.push(
                renderCurve(
                    krPos.rightX,
                    krPos.y,
                    taskPos.leftX,
                    taskPos.y,
                    '#3B82F6',
                    `line-kr-task-${task.kr}-${task.id}`
                )
            );
        });

        setLines(newLines);
    };

    useEffect(() => {
        calculateLines();
        const timers = [
            setTimeout(calculateLines, 100),
            setTimeout(calculateLines, 500),
            setTimeout(calculateLines, 1000)
        ];

        window.addEventListener('resize', calculateLines);
        return () => {
            timers.forEach(t => clearTimeout(t));
            window.removeEventListener('resize', calculateLines);
        };
    }, [objectives, krs, tasks]);

    return (
        <div className="relative overflow-x-auto min-h-[600px]">
            <div
                ref={containerRef}
                className="min-w-[1400px] flex flex-col gap-8 p-6 relative"
            >
                {/* 全局添加按钮 */}
                <div className="flex flex-row items-center gap-32 px-4 sticky top-0 z-20">
                    <div className="w-64"></div>
                    <div className="w-64 flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className=""
                            onClick={() => onAddKr?.()}
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            添加 KR
                        </Button>
                    </div>
                    <div className="w-64 flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className=""
                            onClick={() => onAddTask?.()}
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            添加任务
                        </Button>
                    </div>
                </div>

                {/* 背景连线 */}
                <svg className="absolute top-0 left-0 pointer-events-none w-full h-full z-0">
                    {lines}
                </svg>

                {objectives.map((obj) => {
                    const relatedKrs = krs.filter(kr =>
                        Array.isArray(kr.objectives)
                            ? kr.objectives.includes(obj.id)
                            : kr.objectives === obj.id
                    );

                    return (
                        <div key={obj.id} className="flex flex-row items-start gap-32">
                            {/* 目标卡片 */}
                            <Card
                                data-id={obj.id}
                                data-type="obj"
                                className="w-64 shrink-0 rounded-2xl border-orange-100 shadow-sm hover:shadow-md transition-all z-10 self-center !p-0"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <FlagIcon className="h-4 w-4 text-orange-500" />
                                            <span className="text-xs font-medium text-orange-600">目标</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-orange-400 hover:text-orange-600 hover:bg-orange-50"
                                            onClick={() => onAddKr?.(obj.id)}
                                        >
                                            <PlusIcon className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <h4 className="font-bold text-sm line-clamp-2">{obj.name}</h4>
                                </CardContent>
                            </Card>

                            {/* 关键结果列 */}
                            <div className="flex flex-col gap-12 flex-1">
                                {relatedKrs.map((kr) => {
                                    const progress = (kr.current_value / kr.target_value) * 100;
                                    const relatedTasks = tasks.filter(t => t.kr === kr.id);

                                    return (
                                        <div key={kr.id} className="flex flex-row items-start gap-32">
                                            {/* 关键结果卡片 */}
                                            <Card
                                                data-id={kr.id}
                                                data-type="kr"
                                                className="w-64 shrink-0 rounded-2xl border-blue-100 shadow-sm hover:shadow-md transition-all bg-blue-50/30 z-10 self-center !p-0"
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <TrophyIcon className="h-4 w-4 text-blue-500" />
                                                            <span className="text-xs font-medium text-blue-600">关键结果</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => onAddTask?.(kr.id)}
                                                        >
                                                            <PlusIcon className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <h4 className="font-medium text-sm line-clamp-2 mb-3">{kr.name}</h4>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-[10px] text-neutral-500">
                                                            <span>进度: {kr.current_value}/{kr.target_value} {kr.unit}</span>
                                                            <span>{Math.round(progress)}%</span>
                                                        </div>
                                                        <Progress value={progress} className="h-1 bg-blue-100" />
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* 任务列 */}
                                            <div className="flex flex-col gap-4 flex-1">
                                                {relatedTasks.map((task) => (
                                                    <Card
                                                        key={task.id}
                                                        data-id={task.id}
                                                        data-type="task"
                                                        className="w-56 shrink-0 rounded-xl border-neutral-100 shadow-sm hover:shadow-md transition-all z-10 !p-0"
                                                    >
                                                        <CardContent className="p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-green-500" />
                                                                <span className="text-[10px] font-medium text-green-600">任务</span>
                                                            </div>
                                                            <h4 className="text-xs line-clamp-2 mb-2">{task.name}</h4>
                                                            <Badge variant={task.status === '已完成' ? 'default' : 'outline'} className="text-[9px] h-4 px-1.5 rounded-md">
                                                                {task.status}
                                                            </Badge>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                                {relatedTasks.length === 0 && (
                                                    <div className="w-56 h-12 flex items-center justify-center text-xs text-neutral-300 italic">
                                                        暂无关联任务
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {relatedKrs.length === 0 && (
                                    <div className="w-64 h-24 flex items-center justify-center text-sm text-neutral-300 italic border border-dashed rounded-2xl">
                                        暂无关键结果
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* 处理没有关联目标的 KR（兜底） */}
                {krs.filter(kr => !kr.objectives || (Array.isArray(kr.objectives) && kr.objectives.length === 0)).length > 0 && (
                    <div className="mt-16 pt-16 border-t border-dashed">
                        <h5 className="text-sm font-medium text-neutral-400 mb-8 text-center">未关联目标的 KR</h5>
                        {/* 类似的逻辑显示在底部... */}
                    </div>
                )}
            </div>
        </div>
    );
}
