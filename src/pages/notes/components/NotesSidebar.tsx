import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Note01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
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
}

export function NotesSidebar({ activeFilter, onFilterChange, heatmapData = [], className }: NotesSidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tagsCount, setTagsCount] = useState(0);
  const activeTagId = searchParams.get('tag');

  // 计算统计数据
  const stats = {
    notes: heatmapData.reduce((acc, curr) => acc + curr.count, 0),
    tags: tagsCount,
    days: heatmapData.length
  };

  const handleClearTag = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    setSearchParams(newParams);
  };

  const menuItems = [
    { id: 'all', label: '全部', icon: Note01Icon },
    { id: 'trash', label: '回收站', icon: Delete02Icon },
  ] as const;

  return (
    <div className={cn("w-64 flex flex-col gap-6 p-4 h-full bg-transparent overflow-y-auto", className)}>
      <div className="space-y-4">
        {/* 用户菜单 */}
        <UserMenu />

        {/* 统计概览 */}
        <div className="flex justify-between gap-2">
          <div className="text-center">
            <div className="text-3xl text-gray-400">{stats.notes}</div>
            <div className="text-xs text-gray-400">笔记</div>
          </div>
          <div className="text-center">
            <div className="text-3xl text-gray-400">{stats.tags}</div>
            <div className="text-xs text-gray-400">标签</div>
          </div>
          <div className="text-center">
            <div className="text-3xl text-gray-400">{stats.days}</div>
            <div className="text-xs text-gray-400">天数</div>
          </div>
        </div>

        <NoteHeatmap heatmapData={heatmapData} />
      </div>

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
            <HugeiconsIcon icon={item.icon} size={20} />
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </div>

      <TagList
        onTagsCountChange={setTagsCount}
        refreshTrigger={heatmapData}
      />
    </div>
  );
}
