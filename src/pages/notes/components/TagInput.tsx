import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tag01Icon, Cancel01Icon, Add01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  user: string;
}

interface TagInputProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  showAddControl?: boolean;
  className?: string;
}

export function TagInput({ selectedTagIds, onChange, showAddControl = true, className }: TagInputProps) {
  const { user } = useAuth();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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
      setAllTags(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch tags:', error);
      }
    }
  };

  const handleCreateTag = async () => {
    const name = inputValue.trim();
    if (!name || !user?.id) return;

    // 检查是否已存在同名标签
    const existingTag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      if (!selectedTagIds.includes(existingTag.id)) {
        onChange([...selectedTagIds, existingTag.id]);
      }
      setInputValue('');
      return;
    }

    try {
      const record = await pb.collection('note_tags').create<Tag>({
        name,
        user: user.id,
      });
      setAllTags(prev => [...prev, record].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...selectedTagIds, record.id]);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const selectedTags = allTags.filter(t => selectedTagIds.includes(t.id));
  const suggestions = allTags.filter(t =>
    !selectedTagIds.includes(t.id) &&
    t.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("relative space-y-2", className)}>
      {/* 第一行：已选标签列表 */}
      <div className="flex flex-wrap gap-1.5 min-h-[24px]">
        {selectedTags.map(tag => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="pl-2 pr-1 py-0.5 gap-1 rounded-lg bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
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
      </div>

      {/* 第二行：添加控件 */}
      {showAddControl && (
        <div className="relative w-full max-w-[200px]">
          <div className="relative">
            <HugeiconsIcon
              icon={Tag01Icon}
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <Input
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
              className="h-8 pl-8 pr-2 py-1 text-xs rounded-lg border-none bg-black/5 focus-visible:ring-1 focus-visible:ring-blue-500/20"
            />
          </div>

          {isFocused && (inputValue || suggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 z-[9999] bg-white rounded-xl shadow-2xl border border-slate-100 py-1 max-h-48 overflow-y-auto min-w-[200px]">
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
