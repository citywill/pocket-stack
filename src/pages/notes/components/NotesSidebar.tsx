import { HugeiconsIcon } from '@hugeicons/react';
import {
  Note01Icon,
  UserIcon,
  StarIcon,
  ArchiveIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type NoteFilter = 'all' | 'favorites' | 'archived';

interface NotesSidebarProps {
  activeFilter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  className?: string;
}

export function NotesSidebar({ activeFilter, onFilterChange, className }: NotesSidebarProps) {
  const menuItems = [
    { id: 'all', label: '全部', icon: Note01Icon },
    { id: 'favorites', label: '收藏', icon: StarIcon },
    { id: 'archived', label: '归档', icon: ArchiveIcon },
  ] as const;

  return (
    <div className={cn("w-48 flex flex-col gap-2 p-4 h-full bg-transparent", className)}>
      <div className="space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 rounded-xl h-10 px-3 transition-all duration-200",
              activeFilter === item.id
                ? "bg-white shadow-sm text-blue-600 font-medium"
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
