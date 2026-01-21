import { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, ArrowDown01Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import { NoteForm } from './components/NoteForm';
import { NoteItem } from './components/NoteItem';
import { NotesSidebar, type NoteFilter } from './components/NotesSidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PER_PAGE = 10;

interface Note {
  id: string;
  content: string;
  user: string;
  attachments?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  noted: string;
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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
        sort: '-noted',
        expand: 'user',
        requestKey: null,
      };

      const filters: string[] = [];

      // 始终只查询当前用户的笔记
      if (user?.id) {
        if (filter === 'trash') {
          filters.push(`user = "${user.id}" && isDeleted = true`);
        } else {
          filters.push(`user = "${user.id}" && isDeleted != true`);
        }
      }

      if (query.trim()) {
        filters.push(`content ~ "${query}"`);
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
    const isTrash = activeFilter === 'trash';
    if (!confirm(isTrash ? '确定要彻底删除这条笔记吗？此操作不可恢复。' : '确定要将这条笔记移入回收站吗？')) return;

    try {
      if (isTrash) {
        await pb.collection('notes').delete(id);
        toast.success('已彻底删除');
      } else {
        await pb.collection('notes').update(id, { isDeleted: true });
        toast.success('已移入回收站');
      }
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error(isTrash ? '删除失败' : '移入回收站失败');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await pb.collection('notes').update(id, { isDeleted: false });
      toast.success('已恢复笔记');
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to restore note:', error);
      toast.error('恢复失败');
    }
  };

  return (
    <div className="flex justify-center min-h-[calc(100vh-64px)] bg-[#f7f7f7]">
      <div className="flex w-full max-w-4xl px-4 gap-6 justify-center">
        {/* 桌面端侧边栏 - 固定在左侧 */}
        <aside className="hidden md:block w-70 shrink-0 pt-6">
          <div className="sticky top-6">
            <NotesSidebar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              className="w-full p-0"
            />
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 w-full max-w-xl pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* 移动端侧边栏触发按钮 */}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-xl bg-white shadow-sm">
                    <HugeiconsIcon icon={Menu01Icon} size={20} className="text-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-none bg-[#f7f7f7]">
                  <SheetHeader className="p-6 pb-2 text-left">
                    <SheetTitle className="text-xl font-bold text-foreground/80">笔记</SheetTitle>
                  </SheetHeader>
                  <NotesSidebar
                    activeFilter={activeFilter}
                    onFilterChange={(filter) => {
                      setActiveFilter(filter);
                      setIsSheetOpen(false);
                    }}
                    className="w-full"
                  />
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-bold text-foreground/80">
                {activeFilter === 'trash' ? '回收站' : '笔记'}
              </h1>
            </div>
            <div className="relative w-40 md:w-64">
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
          {activeFilter !== 'trash' && (
            <NoteForm onSuccess={() => fetchNotes(searchQuery, 1, false, activeFilter)} />
          )}

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
                    onRestore={handleRestore}
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
