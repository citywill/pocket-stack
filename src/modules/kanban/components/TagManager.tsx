import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pb } from '@/lib/pocketbase';
import type { KanbanTag } from '../types';
import { toast } from 'sonner';
import { TrashIcon, PlusIcon, CheckIcon, PencilIcon } from '@heroicons/react/24/outline';

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: KanbanTag[];
  onRefresh: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6',
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#64748b'
];

export function TagManager({ open, onOpenChange, tags, onRefresh }: TagManagerProps) {
  const [editingTag, setEditingTag] = useState<KanbanTag | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEditingTag(null);
    setName('');
    setColor(PRESET_COLORS[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const authData = pb.authStore.model;
      if (!authData) throw new Error('未登录');

      const data = {
        name: name.trim(),
        color,
        user: authData.id,
      };

      if (editingTag) {
        await pb.collection('kanban_tags').update(editingTag.id, data);
        toast.success('标签更新成功');
      } else {
        await pb.collection('kanban_tags').create(data);
        toast.success('标签创建成功');
      }
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('保存标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag: KanbanTag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color || PRESET_COLORS[0]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个标签吗？')) return;

    setLoading(true);
    try {
      await pb.collection('kanban_tags').delete(id);
      toast.success('标签删除成功');
      onRefresh();
    } catch (error) {
      toast.error('标签删除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) resetForm();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>管理标签</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">标签名称</Label>
            <div className="flex gap-2">
              <Input
                id="tagName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入标签名称"
                required
              />
              <Button type="submit" disabled={loading}>
                {editingTag ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
              </Button>
              {editingTag && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  取消
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>选择颜色</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-black scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </form>

        <div className="border-t pt-4">
          <Label className="mb-2 block">已有标签</Label>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {tags.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">暂无标签</p>
            )}
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm">{tag.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tag)}>
                    <PencilIcon className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(tag.id)}>
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
