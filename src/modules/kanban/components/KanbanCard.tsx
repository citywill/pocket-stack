import type { KanbanTask } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface KanbanCardProps {
  task: KanbanTask;
  onClick?: () => void;
}

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const PRIORITY_LABELS = {
  low: '低',
  medium: '中',
  high: '高',
};

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const tags = task.expand?.tags || [];

  return (
    <Card
      className="cursor-pointer hover:border-blue-500/50 transition-colors shadow-sm group p-0"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight group-hover:text-blue-600 transition-colors">
            {task.title}
          </h3>
          <Badge className={cn('shrink-0 text-[10px] px-1.5 py-0', PRIORITY_COLORS[task.priority])} variant="secondary">
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          {task.is_archived && (
            <Badge className="shrink-0 text-[10px] px-1.5 py-0 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-none" variant="secondary">
              <ArchiveBoxIcon className="w-3 h-3 mr-0.5" />
              已归档
            </Badge>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description.replace(/<[^>]*>/g, '')}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: tag.color || '#94a3b8' }}
                />
                {tag.name}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 mt-2">
          <div className="flex items-center text-[10px] text-muted-foreground">
            <CalendarIcon className="mr-1 h-3 w-3" />
            {format(new Date(task.created), 'MM-dd HH:mm', { locale: zhCN })}
          </div>

          <div className="flex -space-x-1">
            {/* 这里可以放协作者头像，目前只有自己 */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
