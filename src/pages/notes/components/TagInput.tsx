import { useState, useEffect, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tag01Icon, Cancel01Icon, Add01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface Tag {
  id: string;
  name: string;
  user: string;
  isTemp?: boolean; // 是否是本地临时标签
}

interface TagInputProps {
  selectedTagIds: string[];
  initialTempTags?: Tag[]; // 传入初始临时标签
  onChange: (tagIds: string[], tempTags?: Tag[]) => void;
  showAddControl?: boolean;
  showSelectedTags?: boolean;
  className?: string;
}

export function TagInput({
  selectedTagIds,
  initialTempTags = [],
  onChange,
  showAddControl = true,
  showSelectedTags = true,
  className
}: TagInputProps) {
  const { user } = useAuth();
  const [dbTags, setDbTags] = useState<Tag[]>([]); // 仅存储数据库中的标签
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddControl) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showAddControl]);

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
      setDbTags(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch tags:', error);
      }
    }
  };

  // 动态合并数据库标签和父组件传入的临时标签
  const allTags = [...dbTags];
  initialTempTags.forEach(tempTag => {
    if (!allTags.find(t => t.id === tempTag.id)) {
      allTags.push(tempTag);
    }
  });
  allTags.sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateTag = () => {
    const name = inputValue.trim();
    if (!name || !user?.id) return;

    const existingTag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      if (!selectedTagIds.includes(existingTag.id)) {
        onChange([...selectedTagIds, existingTag.id], initialTempTags);
      }
      setInputValue('');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const newTag: Tag = {
      id: tempId,
      name,
      user: user.id,
      isTemp: true
    };

    onChange([...selectedTagIds, tempId], [...initialTempTags, newTag]);
    setInputValue('');
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId), initialTempTags);
    } else {
      onChange([...selectedTagIds, tagId], initialTempTags);
    }
  };

  const selectedTags = allTags.filter(t => selectedTagIds.includes(t.id));
  const suggestions = allTags.filter(t =>
    !selectedTagIds.includes(t.id) &&
    t.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {/* 已选标签列表 */}
      {showSelectedTags && selectedTags.map(tag => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="pl-2 pr-1 py-0.5 gap-1 rounded-lg bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 whitespace-nowrap"
        >
          <span className="text-xs font-medium">{tag.name}</span>
          <button
            onClick={() => toggleTag(tag.id)}
            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} />
          </button>
        </Badge>
      ))}

      {/* 标签输入控件 */}
      {showAddControl && (
        <div className="relative flex-1 min-w-[120px] max-w-[200px]">
          <div className="relative">
            <HugeiconsIcon
              icon={Tag01Icon}
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (suggestions.length > 0 && inputValue) {
                    toggleTag(suggestions[0].id);
                    setInputValue('');
                  } else {
                    handleCreateTag();
                  }
                }
              }}
              placeholder="添加标签..."
              className="h-8 pl-8 pr-2 py-1 text-xs rounded-lg border-none bg-black/5 focus-visible:ring-1 focus-visible:ring-blue-500/20 w-full"
            />
          </div>

          {isFocused && (inputValue || suggestions.length > 0) && (
            <div className="absolute top-full left-0 mt-1 z-[9999] bg-white rounded-xl shadow-2xl border border-slate-100 py-1 max-h-48 overflow-y-auto min-w-[180px]">
              {suggestions.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => {
                    toggleTag(tag.id);
                    setInputValue('');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between group"
                >
                  <span className="text-foreground/70">{tag.name}</span>
                  <HugeiconsIcon icon={Add01Icon} size={12} className="text-muted-foreground/0 group-hover:text-muted-foreground/50" />
                </button>
              ))}
              {inputValue && !allTags.find(t => t.name.toLowerCase() === inputValue.toLowerCase()) && (
                <button
                  onClick={handleCreateTag}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                >
                  <HugeiconsIcon icon={Add01Icon} size={12} />
                  <span>创建标签 "{inputValue}"</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
