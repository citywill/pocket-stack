import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Note01Icon,
  Delete02Icon,
  Tag01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NoteHeatmap } from './NoteHeatmap';
import { Separator } from '@/components/ui/separator';

export type NoteFilter = 'all' | 'trash';

interface Tag {
  id: string;
  name: string;
}

interface NotesSidebarProps {
  activeFilter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  heatmapData?: { date: string; count: number }[];
  className?: string;
}

export function NotesSidebar({ activeFilter, onFilterChange, heatmapData = [], className }: NotesSidebarProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tags, setTags] = useState<Tag[]>([]);
  const activeTagId = searchParams.get('tag');

  useEffect(() => {
    if (user?.id) {
      fetchTags();
    }
  }, [user?.id]);

  const fetchTags = async () => {
    try {
      const records = await pb.collection('note_tags').getFullList<Tag>({
        filter: `user = "${user?.id}"`,
        sort: 'name',
        requestKey: null,
      });
      setTags(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch tags:', error);
      }
    }
  };

  const handleTagClick = (tagId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (tagId) {
      if (activeTagId === tagId) {
        newParams.delete('tag');
      } else {
        newParams.set('tag', tagId);
      }
    } else {
      newParams.delete('tag');
    }
    setSearchParams(newParams);
  };

  const menuItems = [
    { id: 'all', label: '全部', icon: Note01Icon },
    { id: 'trash', label: '回收站', icon: Delete02Icon },
  ] as const;

  return (
    <div className={cn("w-64 flex flex-col gap-6 p-4 h-full bg-transparent overflow-y-auto", className)}>
      <NoteHeatmap heatmapData={heatmapData} />

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
              handleTagClick(null);
            }}
          >
            <HugeiconsIcon icon={item.icon} size={20} />
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="space-y-3">
          <div className="px-3">
            <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
              <HugeiconsIcon icon={Tag01Icon} size={14} />
              标签
            </h3>
          </div>
          <div className="space-y-1">
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 rounded-xl h-9 px-3 transition-all duration-200",
                  activeTagId === tag.id
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                )}
                onClick={() => handleTagClick(tag.id)}
              >
                <span className="text-sm"># {tag.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
