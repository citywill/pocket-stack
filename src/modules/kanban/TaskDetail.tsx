import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ArrowLeftIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import type { KanbanTask, KanbanTag, KanbanLog } from './types';
import { TaskFormDrawer } from './components/TaskFormDrawer';
import { TagManager } from './components/TagManager';

const STATUS_MAP: Record<string, string> = {
  todo: '待处理',
  in_progress: '进行中',
  done: '已完成',
};

const PRIORITY_MAP: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
};

export default function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<KanbanTask | null>(null);
  const [tags, setTags] = useState<KanbanTag[]>([]);
  const [logs, setLogs] = useState<KanbanLog[]>([]);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    try {
      const taskRecord = await pb.collection('kanban_tasks').getOne<KanbanTask>(id, {
        expand: 'tags',
      });
      setTask(taskRecord);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch task:', error);
        toast.error('获取任务失败');
        navigate('/kanban');
      }
    }
  }, [id, navigate]);

  const fetchLogs = useCallback(async () => {
    if (!id) return;
    try {
      const records = await pb.collection('kanban_logs').getList<KanbanLog>(1, 50, {
        sort: '-created',
        filter: `task = "${id}"`,
      });
      setLogs(records.items);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch logs:', error);
      }
    }
  }, [id]);

  const fetchTags = useCallback(async () => {
    try {
      const records = await pb.collection('kanban_tags').getFullList<KanbanTag>();
      setTags(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch tags:', error);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTask(), fetchLogs(), fetchTags()]);
      setLoading(false);
    };
    loadData();
  }, [fetchTask, fetchLogs, fetchTags]);

  useEffect(() => {
    if (task) {
      pb.collection('kanban_tasks').subscribe('*', (e) => {
        if (e.action === 'update' && e.record.id === task.id) {
          fetchTask();
        } else if (e.action === 'delete' && e.record.id === task.id) {
          navigate('/kanban');
        }
      });
      return () => {
        pb.collection('kanban_tasks').unsubscribe();
      };
    }
  }, [task, fetchTask, navigate]);

  const handleSaveRemark = async () => {
    if (!id || !remark.trim()) return;
    setSaving(true);
    try {
      const authData = pb.authStore.model;
      await pb.collection('kanban_logs').create({
        task: id,
        content: '更新了备注',
        remark: remark,
        user: authData?.id,
      });
      setRemark('');
      fetchLogs();
      toast.success('备注已保存');
    } catch (error) {
      console.error('Failed to save remark:', error);
      toast.error('保存备注失败');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!id || !task) return;
    try {
      const newArchived = !task.is_archived;
      await pb.collection('kanban_tasks').update(id, {
        is_archived: newArchived,
      });
      const authData = pb.authStore.model;
      await pb.collection('kanban_logs').create({
        task: id,
        content: newArchived ? '归档了任务' : '取消归档了任务',
        user: authData?.id,
      });
      toast.success(newArchived ? '任务已归档' : '任务已取消归档');
      fetchTask();
    } catch (error) {
      console.error('Failed to archive task:', error);
      toast.error('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('确定要删除这个任务吗？此操作不可恢复。')) return;
    try {
      await pb.collection('kanban_tasks').delete(id);
      toast.success('任务已删除');
      navigate('/kanban');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('删除失败');
    }
  };

  const handleSaveTask = () => {
    setIsDrawerOpen(false);
    fetchTask();
    fetchLogs();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const taskTags = task.expand?.tags || [];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/kanban')} className="h-9 w-9">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 truncate">任务详情</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={() => setIsDrawerOpen(true)}>
              <PencilIcon className="w-4 h-4 mr-2" />
              编辑
            </Button>

            <Button variant="outline" size="sm" onClick={handleArchive}>
              <ArchiveBoxIcon className="w-4 h-4 mr-2" />
              {task.is_archived ? '取消归档' : '归档'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <TrashIcon className="w-4 h-4 mr-2" />
              删除
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 pt-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {STATUS_MAP[task.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                <div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {task.description || '暂无描述'}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide w-16">标签</label>
                    <div className="flex flex-wrap gap-1.5">
                      {taskTags.length > 0 ? (
                        taskTags.map((tag: KanbanTag) => (
                          <Badge key={tag.id} className="text-sm bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">无标签</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide w-16">优先级</label>
                    <Badge className={`text-sm ${PRIORITY_COLOR[task.priority]}`}>
                      {PRIORITY_MAP[task.priority]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide w-16">截止日期</label>
                    <span className="text-sm text-gray-900">
                      {task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd', { locale: zhCN }) : '未设置'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t text-xs text-gray-400 space-y-1">
                  <div>创建时间：{format(new Date(task.created), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</div>
                  <div>更新时间：{format(new Date(task.updated), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">备注</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="添加备注..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="min-h-[40px] resize-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={handleSaveRemark} disabled={saving || !remark.trim()}>
                      {saving ? '保存中...' : '保存备注'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-lg">任务动态</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4 pt-0">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                      暂无动态记录
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log) => (
                        <div key={log.id} className="bg-white p-3 rounded-lg shadow-sm border">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.created), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md whitespace-pre-wrap border border-gray-100">
                            {log.content}
                          </div>
                          {log.remark && (
                            <div className="text-sm mt-2 text-gray-700">
                              {log.remark}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <TaskFormDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        task={task || undefined}
        tags={tags}
        defaultStatus={task?.status || 'todo'}
        onSave={handleSaveTask}
        onManageTags={() => setIsTagManagerOpen(true)}
      />

      <TagManager
        open={isTagManagerOpen}
        onOpenChange={setIsTagManagerOpen}
        tags={tags}
        onRefresh={fetchTags}
      />
    </div>
  );
}
