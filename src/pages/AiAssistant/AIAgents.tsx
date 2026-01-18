import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  PlusSignIcon,
  PencilEdit01Icon,
  Delete01Icon,
  RobotIcon,
  AiChat02Icon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { AgentForm } from './components/AgentForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  avatar?: string;
  created: string;
}

export function AIAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const navigate = useNavigate();

  const fetchAgents = async () => {
    try {
      setLoading(true);
      let filter = '';
      if (search) {
        filter = `name ~ "${search}" || description ~ "${search}"`;
      }

      const result = await pb.collection('ai_agents').getFullList<Agent>({
        sort: '-created',
        filter,
        requestKey: null
      });
      setAgents(result);
    } catch (error: any) {
      if (error?.isAbort) return;
      console.error('Fetch agents error:', error);
      toast.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAgents();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个智能体吗？')) return;
    try {
      await pb.collection('ai_agents').delete(id);
      toast.success('删除成功');
      fetchAgents();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingId(undefined);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">智能体管理</h2>
          <p className="text-muted-foreground">
            创建和管理用于 AI 对话的智能体人设。
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/ai-playground')} variant="outline">
            <HugeiconsIcon icon={AiChat02Icon} className="mr-2 h-4 w-4" />
            前往对话
          </Button>
          <Button onClick={handleCreate}>
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            新增智能体
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="搜索名称或描述..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>智能体</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="max-w-[300px]">系统提示词</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    暂无智能体
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar ? pb.files.getURL(agent, agent.avatar) : ''} />
                          <AvatarFallback>
                            <HugeiconsIcon icon={RobotIcon} className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {agent.description || '-'}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {agent.system_prompt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(agent.id)}
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(agent.id)}
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AgentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        agentId={editingId}
        onSuccess={fetchAgents}
      />
    </div>
  );
}
