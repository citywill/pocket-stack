import { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { NoteForm } from './components/NoteForm';
import { NoteItem } from './components/NoteItem';
import { NotesSidebar, type NoteFilter } from './components/NotesSidebar';

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

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NoteFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotes = useCallback(async (query = searchQuery, targetPage = 1, isAppend = false, filter = activeFilter) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const options: any = {
        sort: '-created',
        expand: 'user',
        requestKey: null,
      };

      const filters: string[] = [];

      if (query.trim()) {
        filters.push(`content ~ "${query}"`);
      }

      if (filter === 'mine' && user?.id) {
        filters.push(`user = "${user.id}"`);
      } else if (filter === 'favorites') {
        filters.push(`isFavorite = true`);
      } else if (filter === 'archived') {
        filters.push(`isArchived = true`);
      }

      if (filters.length > 0) {
        options.filter = filters.join(' && ');
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
  }, [searchQuery, activeFilter, user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(searchQuery, 1, false, activeFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, fetchNotes]);

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
    <div className="flex justify-center min-h-[calc(100vh-64px)] bg-[#f7f7f7]">
      <div className="flex w-full max-w-5xl px-4 gap-6">
        {/* 侧边栏 - 固定在左侧 */}
        <aside className="hidden md:block w-48 shrink-0 pt-6">
          <div className="sticky top-6">
            <NotesSidebar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              className="w-full p-0"
            />
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 max-w-2xl pt-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-foreground/80">笔记</h1>
            <div className="relative w-48 md:w-64">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="搜索..."
                className="pl-10 h-9 rounded-xl bg-white border-none shadow-sm focus-visible:ring-1 focus-visible:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 发布框 */}
          <NoteForm onSuccess={() => fetchNotes(searchQuery, 1, false, activeFilter)} />

          {/* 笔记列表 */}
          <div className="space-y-4 pb-10 mt-6">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">加载中...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-white rounded-2xl shadow-sm">暂无笔记</div>
            ) : (
              <>
                {notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onDelete={handleDelete}
                    onUpdate={() => fetchNotes(searchQuery, 1, false, activeFilter)}
                  />
                ))}

                {/* 加载更多 */}
                <div className="mt-8 flex justify-center pb-10">
                  {hasMore ? (
                    <Button
                      variant="ghost"
                      className="rounded-xl text-muted-foreground hover:text-primary hover:bg-white px-8 shadow-sm"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "加载中..." : "加载更多"}
                    </Button>
                  ) : notes.length > 0 ? (
                    <span className="text-sm text-muted-foreground">没有更多笔记了</span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
