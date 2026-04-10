import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TreeSelect } from '@/components/ui/tree-select';
import { useAuth } from '@/components/auth-provider';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { Note, Category } from '../types';

const COLLECTION_NAME = 'treenote_notes';

interface NoteFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  categories: Category[];
  onSuccess: () => void;
}

export function NoteFormDrawer({
  open,
  onOpenChange,
  note,
  categories,
  onSuccess,
}: NoteFormDrawerProps) {
  const { user, isSuperAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setCategory(note.category);
    } else {
      setTitle('');
      setContent('');
      setCategory('');
    }
  }, [note, open]);

  const handleSubmit = async () => {
    if (!user || !title.trim() || !category) return;
    if (isSuperAdmin) {
      toast.error('超级管理员无权保存内容');
      return;
    }
    setSaving(true);
    try {
      const payload = { title: title.trim(), content, category, user: user.id };
      if (note) {
        await pb.collection(COLLECTION_NAME).update(note.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection(COLLECTION_NAME).create(payload);
        toast.success('创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{note ? '编辑笔记' : '创建笔记'}</SheetTitle>
        </SheetHeader>
        {isSuperAdmin && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
            超级管理员无法保存内容
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入笔记标题"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <TreeSelect
              value={category}
              onChange={setCategory}
              categories={categories}
              placeholder="选择分类"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入笔记内容"
              className="min-h-[200px] rounded-xl"
            />
          </div>
        </div>
        <SheetFooter className="flex gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !category || isSuperAdmin}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}