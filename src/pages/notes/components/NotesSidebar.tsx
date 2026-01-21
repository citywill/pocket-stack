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
import { UserMenu } from './UserMenu';

export type NoteFilter = 'all' | 'trash';

interface Tag {
  id: string;
  name: string;
  count?: number;
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

  // 计算统计数据
  const stats = {
    notes: heatmapData.reduce((acc, curr) => acc + curr.count, 0),
    tags: tags.length,
    days: heatmapData.length
  };

  useEffect(() => {
    if (user?.id) {
      fetchTags();
    }
  }, [user?.id, heatmapData]); // 当热力图数据更新时（通常意味着笔记有增删改），刷新标签计数

  const fetchTags = async () => {
    try {
      const records = await pb.collection('note_tags').getFullList<Tag>({
        filter: `user = "${user?.id}"`,
        sort: 'name',
        requestKey: null,
      });

      // 并行获取每个标签的笔记数量（仅统计当前用户的、未被软删除的笔记）
      const tagsWithCounts = await Promise.all(records.map(async (tag) => {
        try {
          // 必须通过 note 关系字段进行过滤，确保统计的是有效笔记
          const result = await pb.collection('note_tag_links').getList(1, 1, {
            filter: `tag = "${tag.id}" && note.user = "${user?.id}" && note.isDeleted != true`,
            requestKey: null,
          });
          return { ...tag, count: result.totalItems };
        } catch (e) {
          return { ...tag, count: 0 };
        }
      }));

      setTags(tagsWithCounts);
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
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm"># {tag.name}</span>
                  {tag.count !== undefined && tag.count > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      activeTagId === tag.id
                        ? "bg-blue-200/50 text-blue-700"
                        : "bg-slate-100 text-muted-foreground"
                    )}>
                      {tag.count}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
