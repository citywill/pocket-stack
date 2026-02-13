import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    FlagIcon,
    TrophyIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
    label: string;
    value: string | number;
    progress?: number;
    icon: React.ElementType;
    colorClass: string;
    progressColorClass?: string;
}

function StatCard({ label, value, progress, icon: Icon, colorClass, progressColorClass }: StatCardProps) {
    return (
        <Card className={`rounded-2xl border-none ${colorClass} !p-0`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-xs ${colorClass.includes('orange') ? 'text-orange-600 dark:text-orange-400' :
                            colorClass.includes('blue') ? 'text-blue-600 dark:text-blue-400' :
                                colorClass.includes('green') ? 'text-green-600 dark:text-green-400' :
                                    'text-purple-600 dark:text-purple-400'}`}>
                            {label}
                        </p>
                        <h3 className="mt-1 text-xl font-bold">{value}</h3>
                    </div>
                    <Icon className={`h-8 w-8 ${colorClass.includes('orange') ? 'text-orange-500' :
                        colorClass.includes('blue') ? 'text-blue-500' :
                            colorClass.includes('green') ? 'text-green-500' :
                                'text-purple-500'}`} />
                </div>
                {progress !== undefined && (
                    <Progress value={progress} className={`mt-2 h-1 ${progressColorClass}`} />
                )}
            </CardContent>
        </Card>
    );
}

interface StatCardsProps {
    objectivesCount: number;
    krProgress: number;
    taskProgress: number;
    timeProgress: number;
}

export function StatCards({ objectivesCount, krProgress, taskProgress, timeProgress }: StatCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-6">
            <StatCard
                label="目标"
                value={`${objectivesCount} 个`}
                icon={FlagIcon}
                colorClass="bg-orange-50 dark:bg-orange-900/20"
            />

            <StatCard
                label="KR 总达成率"
                value={`${krProgress}%`}
                progress={krProgress}
                icon={TrophyIcon}
                colorClass="bg-blue-50 dark:bg-blue-900/20"
                progressColorClass="bg-blue-200"
            />

            <StatCard
                label="任务完成率"
                value={`${taskProgress}%`}
                progress={taskProgress}
                icon={ClipboardDocumentCheckIcon}
                colorClass="bg-green-50 dark:bg-green-900/20"
                progressColorClass="bg-green-200"
            />

            <StatCard
                label="时间进度"
                value={`${timeProgress}%`}
                progress={timeProgress}
                icon={ClockIcon}
                colorClass="bg-purple-50 dark:bg-purple-900/20"
                progressColorClass="bg-purple-200"
            />
        </div>
    );
}
