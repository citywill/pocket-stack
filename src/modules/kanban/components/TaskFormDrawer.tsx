import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
import { Checkbox } from '@/components/ui/checkbox';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import type { KanbanTask, KanbanTaskStatus, KanbanTaskPriority, KanbanTag, KanbanLog } from '../types';
import { toast } from 'sonner';
import { TrashIcon, TagIcon, CheckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: KanbanTask;
  tags: KanbanTag[];
  defaultStatus: KanbanTaskStatus;
  onSave: () => void;
  onManageTags?: () => void;
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
  const [logs, setLogs] = useState<KanbanLog[]>([]);
  const [remark, setRemark] = useState('');
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
      });
      fetchLogs(task.id);
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'medium',
        tags: [],
      });
      setLogs([]);
    }
    setRemark(''); // 重置备注
  }, [task, open, defaultStatus]);

  const fetchLogs = async (taskId: string) => {
    try {
      const result = await pb.collection('kanban_logs').getFullList<KanbanLog>({
        filter: `task = "${taskId}"`,
        sort: '-created',
        requestKey: `task_logs_${taskId}`, // 使用 taskId 相关的 requestKey
      });
      setLogs(result);
    } catch (error: any) {
      if (error.isAbort) return;
      console.error('Fetch logs error:', error);
    }
  };

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

      let savedTask: KanbanTask;
      if (task) {
        await pb.collection('kanban_tasks').update(task.id, data);
        toast.success('更新成功');

        if (
          formData.status !== task.status ||
          formData.priority !== task.priority ||
          formData.title !== task.title ||
          formData.is_archived !== task.is_archived ||
          JSON.stringify(formData.tags) !== JSON.stringify(task.tags)
        ) {
          // 记录日志
          const changes: string[] = [];
          if (task.status !== formData.status) {
            changes.push(`状态从 ${STATUS_OPTIONS.find(s => s.value === task.status)?.label} 变更为 ${STATUS_OPTIONS.find(s => s.value === formData.status)?.label}`);
          }
          if (task.priority !== formData.priority) {
            changes.push(`优先级从 ${PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label} 变更为 ${PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label}`);
          }
          if (task.title !== formData.title) {
            changes.push(`标题变更为 "${formData.title}"`);
          }
          if (task.is_archived !== formData.is_archived) {
            changes.push(formData.is_archived ? '归档了任务' : '取消了归档');
          }
          if (JSON.stringify(task.tags) !== JSON.stringify(formData.tags)) {
            const oldTags = tags.filter(t => task.tags?.includes(t.id)).map(t => t.name).join(', ') || '无';
            const newTags = tags.filter(t => formData.tags?.includes(t.id)).map(t => t.name).join(', ') || '无';
            changes.push(`标签从 [${oldTags}] 变更为 [${newTags}]`);
          }

          // 如果有备注或有变更，创建日志
          if (changes.length > 0 || remark.trim()) {
            const content = changes.length > 0 ? changes.join('; ') : '更新了任务';
            await pb.collection('kanban_logs').create({
              task: task.id,
              content: content,
              remark: remark.trim() || undefined,
              user: authData.id,
            });
          }
        } else if (remark.trim()) {
          // 仅有备注的情况
          await pb.collection('kanban_logs').create({
            task: task.id,
            content: '添加了备注',
            remark: remark.trim(),
            user: authData.id,
          });
        }
      } else {
        savedTask = await pb.collection('kanban_tasks').create(data);
        toast.success('创建成功');

        await pb.collection('kanban_logs').create({
          task: savedTask.id,
          content: '创建了任务',
          remark: remark.trim() || undefined,
          user: authData.id,
        });
      }
      setRemark(''); // 提交后清空
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('确定要删除这个任务吗？')) return;

    setLoading(true);
    try {
      // 1. 先删除关联的日志（PocketBase 默认不一定开启级联删除）
      const logs = await pb.collection('kanban_logs').getFullList({
        filter: `task = "${task.id}"`,
      });

      if (logs.length > 0) {
        await Promise.all(logs.map(log => pb.collection('kanban_logs').delete(log.id)));
      }

      // 2. 再删除任务
      await pb.collection('kanban_tasks').delete(task.id);

      toast.success('删除成功');
      onSave();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败，请检查网络或权限');
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
            <div className="flex items-center justify-between">
              <Label>标签</Label>
              {onManageTags && (
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
              )}
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
                      "group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all duration-200",
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-900/30"
                        : "bg-white border-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full transition-transform group-hover:scale-110",
                        isSelected ? "scale-110" : ""
                      )}
                      style={{ backgroundColor: tag.color || '#94a3b8' }}
                    />
                    <span className="font-medium">{tag.name}</span>
                    {isSelected && (
                      <CheckIcon className="w-3.5 h-3.5 ml-0.5 animate-in zoom-in duration-200" />
                    )}
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

          <div className="space-y-2">
            <Label htmlFor="remark">本次修改备注</Label>
            <Input
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="添加一条日志备注..."
            />
          </div>

          {task && logs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Label className="text-neutral-500">任务动态</Label>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs">
                    <div className="text-neutral-400 shrink-0">
                      {format(new Date(log.created), 'MM-dd HH:mm', { locale: zhCN })}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-neutral-600 dark:text-neutral-300">
                        {log.content}
                      </div>
                      {log.remark && (
                        <div className="text-neutral-500 italic bg-neutral-50 dark:bg-neutral-900/50 p-1.5 rounded border-l-2 border-neutral-200 dark:border-neutral-700">
                          备注: {log.remark}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <Checkbox
              id="is_archived"
              checked={formData.is_archived || false}
              onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_archived: checked })}
            />
            <div className="space-y-0.5">
              <Label htmlFor="is_archived" className="text-sm font-medium cursor-pointer">归档此任务</Label>
              <p className="text-xs text-muted-foreground">归档后任务将不再显示在看板中</p>
            </div>
          </div>


          <SheetFooter className="flex-row justify-between sm:justify-between items-center pt-6 border-t border-neutral-100 dark:border-neutral-800">
            {task ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleDelete}
                disabled={loading}
              >
                <TrashIcon className="h-5 w-5" />
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
