import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { Note, Category } from './types';
import { CategoryTree } from './components/CategoryTree';
import { NoteFormDrawer } from './components/NoteFormDrawer';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const COLLECTION_NAME = 'treenote_notes';

export default function NoteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);

  const selectedCate = searchParams.get('cate');
  const keyword = searchParams.get('keyword') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 10;

  const fetchCategories = useCallback(async () => {
    try {
      const result = await pb.collection('treenote_categories').getFullList({
        sort: 'created',
        requestKey: null,
      });
      setCategories(result as unknown as Category[]);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const filterParts: string[] = [];
      if (selectedCate) {
        filterParts.push(`category = "${selectedCate}"`);
      }
      if (keyword) {
        filterParts.push(`title ~ "${keyword}"`);
      }

      const result = await pb.collection(COLLECTION_NAME).getList(page, pageSize, {
        filter: filterParts.join(' && ') || null,
        sort: '-created',
        expand: 'category',
        requestKey: null,
      });

      setNotes(result.items as unknown as Note[]);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      if (error.isAbort) return;
      console.error('Fetch error:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedCate, keyword, page, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCategorySelect = (id: string | null) => {
    const params: Record<string, string> = {};
    if (id) params.cate = id;
    if (keyword) params.keyword = keyword;
    params.page = '1';
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    const params: Record<string, string> = {};
    if (selectedCate) params.cate = selectedCate;
    if (value) params.keyword = value;
    params.page = '1';
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params: Record<string, string> = {};
    if (selectedCate) params.cate = selectedCate;
    if (keyword) params.keyword = keyword;
    params.page = String(newPage);
    setSearchParams(params);
  };

  const handleCreate = () => {
    setCurrentNote(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (note: Note) => {
    setCurrentNote(note);
    setFormDrawerOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await pb.collection(COLLECTION_NAME).delete(deleteTargetId);
      toast.success('删除成功');
      fetchNotes();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleView = (note: Note) => {
    navigate(`/treenote/note/${note.id}`);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-gray-50/50 overflow-y-auto shrink-0">
        <CategoryTree selectedId={selectedCate} onSelect={handleCategorySelect} />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">笔记列表</h1>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            <PlusIcon className="w-4 h-4 mr-2" />
            创建笔记
          </Button>
        </div>
        <Card>
          <CardContent className="px-4">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索标题..."
                  value={keyword}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-500">加载中...</div>
            ) : notes.length === 0 ? (
              <div className="py-8 text-center text-gray-500">暂无笔记</div>
            ) : (
              <>
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-blue-600 cursor-pointer hover:underline truncate"
                          onClick={() => handleView(note)}
                        >
                          {note.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {note.expand?.category?.name && (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-2">
                              {note.expand.category.name}
                            </span>
                          )}
                          <span>{format(parseISO(note.created), 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(note)}
                          className="rounded-xl"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(note.id)}
                          className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="rounded-xl"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      第 {page} / {totalPages} 页，共 {totalItems} 条
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="rounded-xl"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <NoteFormDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        note={currentNote}
        categories={categories}
        onSuccess={fetchNotes}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这篇笔记吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}