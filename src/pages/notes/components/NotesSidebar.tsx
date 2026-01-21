import { HugeiconsIcon } from '@hugeicons/react';
import {
  Note01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NoteHeatmap } from './NoteHeatmap';

export type NoteFilter = 'all' | 'trash';

interface NotesSidebarProps {
  activeFilter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  heatmapData?: { date: string; count: number }[];
  className?: string;
}

export function NotesSidebar({ activeFilter, onFilterChange, heatmapData = [], className }: NotesSidebarProps) {
  const menuItems = [
    { id: 'all', label: '全部', icon: Note01Icon },
    { id: 'trash', label: '回收站', icon: Delete02Icon },
  ] as const;

  return (
    <div className={cn("w-64 flex flex-col gap-6 p-4 h-full bg-transparent", className)}>
      <NoteHeatmap heatmapData={heatmapData} />
      <div className="space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 rounded-xl h-10 px-3 transition-all duration-200",
              activeFilter === item.id
                ? "bg-white text-blue-600 font-medium"
                : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
            )}
            onClick={() => onFilterChange(item.id)}
          >
            <HugeiconsIcon icon={item.icon} size={20} />
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </div>

    </div>
  );
}
