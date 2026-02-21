import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import {
    TagIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface Tag {
    id: string;
    name: string;
    count?: number;
    isPinned?: boolean;
}

interface TagListProps {
    onTagsCountChange?: (count: number) => void;
    refreshTrigger?: any; // 用于触发刷新，比如热力图数据更新时
}

export function TagList({ onTagsCountChange, refreshTrigger }: TagListProps) {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tags, setTags] = useState<Tag[]>([]);
    const activeTagId = searchParams.get('tag');

    useEffect(() => {
        if (user?.id) {
            fetchTags();
        }
    }, [user?.id, refreshTrigger]);

    const fetchTags = async () => {
        try {
            const records = await pb.collection('note_tags').getFullList<Tag>({
                filter: `user = "${user?.id}"`,
                sort: '-isPinned,name',
                requestKey: null,
            });

            // 直接设置标签列表，不再获取计数
            setTags(records);
            onTagsCountChange?.(records.length);
        } catch (error: any) {
            if (!error.isAbort) {
                console.error('Failed to fetch tags:', error);
            }
        }
    };

    const handleTagClick = (tagId: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (activeTagId === tagId) {
            newParams.delete('tag');
        } else {
            newParams.set('tag', tagId);
        }
        setSearchParams(newParams);
    };

    if (tags.length === 0) return null;

    return (
        <div className="space-y-3 group">
            <div className="px-3">
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <TagIcon className="size-3.5" />
                        标签
                    </div>
                    <Link to="/tags" title="管理标签" className="hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                        <Cog6ToothIcon className="size-3.5" />
                    </Link>
                </h3>
            </div>
            <div className="flex flex-wrap gap-2 px-3">
                {tags.map((tag) => (
                    <div
                        key={tag.id}
                        className={cn(
                            "flex items-center rounded-lg border transition-all duration-200 h-7",
                            activeTagId === tag.id
                                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                                : "bg-white border-transparent hover:border-gray-200 hover:bg-gray-50 text-muted-foreground"
                        )}
                    >
                        <button
                            className="flex items-center h-full px-1.5 text-xs font-medium cursor-pointer select-none gap-1"
                            onClick={() => handleTagClick(tag.id)}
                        >
                            <span className="truncate max-w-[80px]">{tag.name}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
