import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  user: string;
  archived: boolean;
  sort_order: number;
  created?: string;
  updated?: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: Task | null;
  initialDate?: Date;
}

export function TaskForm({ isOpen, onClose, onSuccess, task }: TaskFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        user: user.id,
      };

      if (task) {
        await pb.collection('tasks').update(task.id, data);
      } else {
        // If it's a new task and we have an initial date, we might want to set it
        // However, 'created' is usually system-managed. If we want to allow 
        // backdating, we'd need a separate 'task_date' field.
        // For now, we'll just create it normally.

        // Find max sort_order for status to append
        const statusRecords = await pb.collection('tasks').getList(1, 1, {
          filter: `user = "${user.id}" && status = "${formData.status}"`,
          sort: '-sort_order'
        });
        const maxSortOrder = statusRecords.items[0]?.sort_order || 0;

        await pb.collection('tasks').create({
          ...data,
          sort_order: maxSortOrder + 1000,
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to save task:', error);
        alert('保存失败，请检查网络或后端配置。\n' + (error instanceof Error ? error.message : '未知错误'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-blue-600 p-6 text-white">
          <DialogTitle className="text-xl font-bold">
            {task ? '编辑任务' : '新建任务'}
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-1.5">
            {task ? '修改现有任务的详细信息' : '添加一个新的任务到您的清单中'}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white dark:bg-neutral-900">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-neutral-500">任务标题</Label>
            <Input
              id="title"
              required
              placeholder="例如：准备周一的会议报告"
              className="rounded-xl border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500/20 h-11"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-neutral-500">详细描述 (可选)</Label>
            <Textarea
              id="description"
              placeholder="添加更多关于此任务的细节..."
              className="rounded-xl border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500/20 min-h-[100px] resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-neutral-500">当前状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Task['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="rounded-xl border-neutral-200 dark:border-neutral-800 h-11">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800">
                  <SelectItem value="todo">待办</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-xs font-bold uppercase tracking-wider text-neutral-500">优先级</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="rounded-xl border-neutral-200 dark:border-neutral-800 h-11">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800">
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl px-6 h-11 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? '保存中...' : (task ? '更新任务' : '创建任务')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
