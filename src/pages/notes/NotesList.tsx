import { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { NoteForm } from './components/NoteForm';
import { NoteItem } from './components/NoteItem';

const PER_PAGE = 10;

interface Note {
  id: string;
  content: string;
  user: string;
  attachments?: string[];
  created: string;
  updated: string;
  expand?: {
    user: {
      id: string;
      username: string;
      name: string;
      avatar: string;
    }
  }
}

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotes = useCallback(async (query = searchQuery, targetPage = 1, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const options: any = {
        sort: '-created',
        expand: 'user',
      };

      if (query.trim()) {
        options.filter = `content ~ "${query}"`;
      }

      const result = await pb.collection('notes').getList<Note>(targetPage, PER_PAGE, options);

      if (isAppend) {
        setNotes(prev => [...prev, ...result.items]);
      } else {
        setNotes(result.items);
      }

      setHasMore(result.items.length === PER_PAGE);
      setPage(targetPage);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch notes:', error);
        toast.error('获取笔记失败');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(searchQuery, 1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchNotes]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchNotes(searchQuery, page + 1, true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return;

    try {
      await pb.collection('notes').delete(id);
      toast.success('删除成功');
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('删除失败');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">笔记管理</h1>
        <div className="relative w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="搜索笔记..."
            className="pl-10 rounded-full bg-muted/50 border-1 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 发布框 */}
      <NoteForm onSuccess={fetchNotes} />

      {/* 笔记列表 */}
      <div className="space-y-px pb-10">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">加载中...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">暂无笔记</div>
        ) : (
          <>
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onDelete={handleDelete}
                onUpdate={() => fetchNotes(searchQuery, 1, false)}
              />
            ))}

            {/* 加载更多 */}
            <div className="mt-8 flex justify-center">
              {hasMore ? (
                <Button
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 px-8"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    "加载中..."
                  ) : (
                    <>
                      <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="mr-2" />
                      加载更多
                    </>
                  )}
                </Button>
              ) : notes.length > 0 ? (
                <span className="text-sm text-muted-foreground">没有更多笔记了</span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
