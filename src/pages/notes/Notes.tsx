import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { NoteCreate } from './components/NoteCreate';
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

interface Tag {
  id: string;
  name: string;
}

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
    },
    'note_tag_links(note)'?: {
      id: string;
      tag: string;
      expand?: {
        tag: Tag;
      }
    }[]
  }
}

export default function Notes() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFrom = searchParams.get('from');
  const activeTo = searchParams.get('to');
  const activeTag = searchParams.get('tag');
  const [notes, setNotes] = useState<Note[]>([]);
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NoteFilter>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchHeatmapData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 获取用户所有未删除笔记的时间戳
      const records = await pb.collection('notes').getFullList<Note>({
        filter: `user = "${user.id}" && isDeleted != true`,
        fields: 'noted,created',
        requestKey: null,
      });

      // 统计每天的数量
      const counts: Record<string, number> = {};
      records.forEach(record => {
        const dateStr = new Date(record.noted || record.created).toISOString().split('T')[0];
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });

      const formattedData = Object.entries(counts).map(([date, count]) => ({
        date,
        count
      }));
      setHeatmapData(formattedData);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch heatmap data:', error);
      }
    }
  }, [user?.id]);

  const fetchNotes = useCallback(async (
    query = searchQuery,
    targetPage = 1,
    isAppend = false,
    filter = activeFilter,
    from = activeFrom,
    to = activeTo,
    tag = activeTag
  ) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      if (!isAppend) {
        fetchHeatmapData(); // 刷新数据时同步刷新热力图数据
      }
      const options: any = {
        sort: '-noted,-created',
        expand: 'user,note_tag_links(note).tag',
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

      if (from && to) {
        // 构建起止时间进行过滤，支持日期格式 (YYYY-MM-DD)
        filters.push(`noted >= "${from} 00:00:00" && noted <= "${to} 23:59:59"`);
      }

      if (query.trim()) {
        filters.push(`content ~ "${query}"`);
      }

      // 标签筛选：通过关联表反向查询
      if (tag) {
        // PocketBase 不支持这种深层嵌套的反向查询过滤 (note_tag_links_via_note.tag = "TAG_ID")
        // 我们需要先找出该标签下的所有笔记 ID，然后再过滤
        const links = await pb.collection('note_tag_links').getFullList({
          filter: `tag = "${tag}"`,
          fields: 'note',
          requestKey: null,
        });

        const noteIds = links.map(link => link.note);

        if (noteIds.length === 0) {
          // 如果该标签下没有笔记，则直接返回空列表，避免无效查询
          setNotes([]);
          setHasMore(false);
          setPage(targetPage);
          return; // 提前结束
        }

        // 使用笔记 ID 列表进行过滤
        // id ?= ["id1", "id2"] 语法可能在某些版本不支持，使用 id = "id1" || id = "id2"
        if (noteIds.length > 0) {
          const idFilters = noteIds.map(id => `id = "${id}"`).join(' || ');
          filters.push(`(${idFilters})`);
        }
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
      fetchNotes(searchQuery, 1, false, activeFilter, activeFrom, activeTo, activeTag);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, activeFrom, activeTo, activeTag, fetchNotes]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchNotes(searchQuery, page + 1, true, activeFilter, activeFrom, activeTo, activeTag);
  };

  const handleDelete = async (id: string) => {
    const isTrash = activeFilter === 'trash';
    if (!confirm(isTrash ? '确定要彻底删除这条笔记吗？此操作不可恢复。' : '确定要将这条笔记移入回收站吗？')) return;

    try {
      if (isTrash) {
        // 先删除关联表中的数据
        const links = await pb.collection('note_tag_links').getFullList({
          filter: `note = "${id}"`
        });
        await Promise.all(links.map(link => pb.collection('note_tag_links').delete(link.id)));

        // 再彻底删除笔记
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
      <div className="flex w-full max-w-4xl px-4 gap-8 justify-center">
        {/* 桌面端侧边栏 - 固定在左侧 */}
        <aside className="hidden md:block w-70 shrink-0 pt-6">
          <div className="sticky top-6">
            <NotesSidebar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              heatmapData={heatmapData}
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
                    heatmapData={heatmapData}
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
          {activeFilter !== 'trash' && !activeFrom && (
            <NoteCreate onSuccess={() => fetchNotes(searchQuery, 1, false, activeFilter)} />
          )}

          {/* 过滤区间显示 */}
          {activeFrom && (
            <div className="flex items-center justify-between px-4 py-2 mb-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                正在查看: {activeFrom === activeTo ? activeFrom : `${activeFrom} 至 ${activeTo}`} 的记录
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 gap-1 rounded-lg"
                onClick={() => {
                  searchParams.delete('from');
                  searchParams.delete('to');
                  setSearchParams(searchParams);
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
                清除
              </Button>
            </div>
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
