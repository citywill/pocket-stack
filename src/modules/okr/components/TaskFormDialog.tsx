import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import type { Task, TaskStatus, TaskPriority, Kr } from '../types';
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../types';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okrId: string;
  krs: Kr[];
  task: Task | null;
  onSuccess: () => void;
}

export function TaskFormDialog({ open, onOpenChange, okrId, krs, task, onSuccess }: TaskFormDialogProps) {
  const { user } = useAuth();
  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Task>>({
    defaultValues: {
      status: '待开始',
      priority: '中',
      kr: 'none',
    }
  });

  const status = watch('status');
  const priority = watch('priority');
  const krId = watch('kr');

  useEffect(() => {
    if (open) {
      if (task) {
        reset({
          name: task.name || '',
          status: task.status || '待开始',
          priority: task.priority || '中',
          kr: task.kr || 'none',
          notes: task.notes || '',
        });
      } else {
        reset({
          name: '',
          status: '待开始',
          priority: '中',
          kr: 'none',
          notes: '',
        });
      }
    }
  }, [task, reset, open]);

  const onSubmit = async (data: Partial<Task>) => {
    if (!user) return;
    try {
      const payload: any = {
        name: data.name,
        status: data.status,
        priority: data.priority,
        notes: data.notes || '',
        okr: okrId,
        user: user.id,
      };

      // 处理可选的关系字段 kr
      // 如果后端 maxSelect 为 0，发送数组可能更安全
      if (data.kr && data.kr !== 'none') {
        payload.kr = data.kr;
      } else {
        payload.kr = null; // 或者使用 "" 取决于 PB 配置，通常 null 即可清空
      }

      console.log('Submitting task payload:', payload);

      if (task?.id) {
        await pb.collection('okr_tasks').update(task.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection('okr_tasks').create(payload);
        toast.success('创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Task save error:', error);
      const message = error.data?.message || error.message || '保存失败';
      toast.error(`保存失败: ${message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? '编辑任务' : '添加任务'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">任务名称</Label>
            <Input id="task-name" {...register('name', { required: true })} placeholder="描述具体要做的任务" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 overflow-hidden">
              <Label htmlFor="task-status">状态</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as TaskStatus)}
              >
                <SelectTrigger className="rounded-xl w-full text-left">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 overflow-hidden">
              <Label htmlFor="task-priority">优先级</Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue('priority', value as TaskPriority)}
              >
                <SelectTrigger className="rounded-xl w-full text-left">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 overflow-hidden">
            <Label htmlFor="task-kr">关联关键结果 (KR)</Label>
            <Select
              value={krId}
              onValueChange={(value) => setValue('kr', value)}
            >
              <SelectTrigger className="rounded-xl w-full text-left">
                <div className="truncate pr-2">
                  <SelectValue placeholder="选择关联的 KR (可选)" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-4rem)] sm:max-w-[400px]">
                <SelectItem value="none">无关联</SelectItem>
                {krs.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    <div className="truncate max-w-[300px]">{k.name}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes">备注</Label>
            <Textarea
              id="task-notes"
              {...register('notes')}
              placeholder="添加任务相关的备注信息..."
              className="rounded-xl min-h-[100px] resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">取消</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
