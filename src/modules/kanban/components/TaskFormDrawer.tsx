import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import type { KanbanTask, KanbanTaskStatus, KanbanTaskPriority, KanbanTag } from '../types';
import { toast } from 'sonner';
import { TagIcon } from '@heroicons/react/24/outline';

interface TaskFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: KanbanTask;
  tags: KanbanTag[];
  defaultStatus: KanbanTaskStatus;
  onSave: () => void;
  onManageTags: () => void;
}

const STATUS_OPTIONS: { value: KanbanTaskStatus; label: string }[] = [
  { value: 'todo', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'done', label: '已完成' },
];

const PRIORITY_OPTIONS: { value: KanbanTaskPriority; label: string }[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

export function TaskFormDrawer({
  open,
  onOpenChange,
  task,
  tags,
  defaultStatus,
  onSave,
  onManageTags,
}: TaskFormDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<KanbanTask>>({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium',
    tags: [],
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        tags: task.tags || [],
        deadline: task.deadline ? task.deadline.split(' ')[0] : undefined,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'medium',
        tags: [],
      });
    }
  }, [task, open, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authData = pb.authStore.model;
      if (!authData) throw new Error('未登录');

      const data = {
        ...formData,
        user: authData.id,
      };

      if (task) {
        await pb.collection('kanban_tasks').update(task.id, data);
        toast.success('更新成功');
      } else {
        await pb.collection('kanban_tasks').create(data);
        toast.success('创建成功');
      }
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task ? '编辑任务' : '添加任务'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">任务标题</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="你想做什么？"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as KanbanTaskStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v as KanbanTaskPriority })}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">截止日期</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline || ''}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value || undefined })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>标签</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-700 p-0 px-2"
                onClick={onManageTags}
              >
                <TagIcon className="h-3 w-3 mr-1" />
                管理标签
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag) => {
                const isSelected = formData.tags?.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      const newTags = isSelected
                        ? formData.tags?.filter((id) => id !== tag.id)
                        : [...(formData.tags || []), tag.id];
                      setFormData({ ...formData, tags: newTags });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs border transition-all duration-200",
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-900/30"
                        : "bg-white border-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                    )}
                  >
                    <span className="font-medium">{tag.name}</span>
                  </button>
                );
              })}
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground italic">暂无标签，点击右侧管理标签创建</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="添加更多细节..."
              className="min-h-[120px]"
            />
          </div>



          <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存任务'}
              </Button>
            </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
