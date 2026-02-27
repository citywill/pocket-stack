import { useSearchParams } from 'react-router-dom';
import { DocumentTextIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NoteHeatmap } from './NoteHeatmap';
import { UserMenu } from './UserMenu';
import { TagList } from './TagList';

export type NoteFilter = 'all' | 'trash';

interface NotesSidebarProps {
  activeFilter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  heatmapData?: { date: string; count: number }[];
  className?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function NotesSidebar({ 
  activeFilter, 
  onFilterChange, 
  heatmapData = [], 
  className,
  searchQuery = '',
  onSearchChange
}: NotesSidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTagId = searchParams.get('tag');

  const handleClearTag = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    setSearchParams(newParams);
  };

  const menuItems = [
    { id: 'all', label: '全部', icon: DocumentTextIcon },
    { id: 'trash', label: '回收站', icon: TrashIcon },
  ] as const;

  return (
    <div className={cn("w-64 flex flex-col gap-4 p-4 h-full bg-transparent overflow-y-auto", className)}>
      {/* 用户菜单 */}
      <UserMenu />

      {/* 搜索框 */}
      {onSearchChange && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-10 pr-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* 全部 / 回收站 */}
      <div className="space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 rounded-xl h-10 px-3 transition-all duration-200",
              activeFilter === item.id && !activeTagId
                ? "bg-white text-blue-600 font-medium"
                : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
            )}
            onClick={() => {
              onFilterChange(item.id);
              handleClearTag();
            }}
          >
            <item.icon className="size-5" />
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </div>

      {/* 日历热力图 */}
      <NoteHeatmap heatmapData={heatmapData} />

      {/* 标签 */}
      <TagList refreshTrigger={heatmapData} />
    </div>
  );
}
