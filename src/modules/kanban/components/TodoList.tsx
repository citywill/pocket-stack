import { useState, useCallback, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { KanbanTodo } from '../types';

interface TodoListProps {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  todos: KanbanTodo[];
  onTodosChange: (todos: KanbanTodo[]) => void;
}

export function TodoList({ taskId, taskTitle, taskDescription, todos, onTodosChange }: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const saveTodos = useCallback(async (newTodos: KanbanTodo[], logContent?: string) => {
    try {
      await pb.collection('kanban_tasks').update(taskId, {
        todos: newTodos,
      });
      if (logContent) {
        const authData = pb.authStore.model;
        await pb.collection('kanban_logs').create({
          task: taskId,
          content: logContent,
          user: authData?.id,
        });
      }
      onTodosChange(newTodos);
    } catch (error) {
      console.error('Failed to save todos:', error);
      toast.error('保存失败');
    }
  }, [taskId, onTodosChange]);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setSaving(true);
    try {
      const todo: KanbanTodo = {
        id: crypto.randomUUID(),
        content: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      const newTodos = [...todos, todo];
      await saveTodos(newTodos, `添加了待办事项：${todo.content}`);
      setNewTodo('');
      toast.success('待办事项已添加');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add todo:', error);
      toast.error('添加失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const newTodos = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    const logContent = todo.completed 
      ? `取消完成待办事项：${todo.content}`
      : `完成待办事项：${todo.content}`;
    await saveTodos(newTodos, logContent);
    toast.success(newTodos.find((t) => t.id === id)?.completed ? '任务已完成' : '任务已取消完成');
  };

  const handleDeleteTodo = async (id: string) => {
    const todoToDelete = todos.find((todo) => todo.id === id);
    const logContent = todoToDelete ? `删除了待办事项：${todoToDelete.content}` : '删除了待办事项';
    const newTodos = todos.filter((todo) => todo.id !== id);
    await saveTodos(newTodos, logContent);
    toast.success('待办事项已删除');
  };

  const handleStartEdit = (todo: KanbanTodo) => {
    setEditingId(todo.id);
    setEditingContent(todo.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingContent.trim()) {
      setEditingId(null);
      setEditingContent('');
      return;
    }
    const todo = todos.find((t) => t.id === editingId);
    if (!todo) return;
    
    if (todo.content !== editingContent.trim()) {
      const newTodos = todos.map((t) =>
        t.id === editingId ? { ...t, content: editingContent.trim() } : t
      );
      await saveTodos(newTodos, `修改了待办事项：${editingContent.trim()}`);
      toast.success('待办事项已更新');
    }
    setEditingId(null);
    setEditingContent('');
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;
    
    const newTodos = Array.from(todos);
    const [removed] = newTodos.splice(sourceIndex, 1);
    newTodos.splice(destinationIndex, 0, removed);
    await saveTodos(newTodos);
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiResult('');

    try {
      const existingTodos = todos.length > 0 
        ? todos.map(t => `- ${t.completed ? '[x]' : '[ ]'} ${t.content}`).join('\n')
        : '暂无待办事项';

      const systemPrompt = `你是一个智能任务助手。请根据任务信息和用户提示词，生成待办事项列表。
生成的待办事项应该：
1. 切合任务标题和描述
2. 具体、可执行
3. 按照逻辑顺序排列
4. 每行一个待办事项，不需要编号，不需要方括号
5. 只输出待办事项内容，不要有其他解释
6. 如果任务已经有待办事项，请根据任务内容补充完善`;

      const userPrompt = aiPrompt.trim()
        ? `任务标题：${taskTitle}
任务描述：${taskDescription || '暂无描述'}

当前待办事项：
${existingTodos}

用户提示词：${aiPrompt}`
        : `任务标题：${taskTitle}
任务描述：${taskDescription || '暂无描述'}

当前待办事项：
${existingTodos}

请根据任务内容，生成合适的待办事项列表。`;

      const proxyUrl = '/api/llm/chat/completions';
      const model = (import.meta as any).env.VITE_ALI_LLM_MODEL || 'qwen-turbo';

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: true
        })
      });

      if (!response.ok) throw new Error('AI 响应错误');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                accumulatedContent += content;
                setAiResult(accumulatedContent);
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error('生成失败：' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiResult = async () => {
    if (!aiResult.trim()) return;

    const lines = aiResult.split('\n').filter(line => {
      const trimmed = line.trim().replace(/^[-*]\s*/, '').replace(/^\[\s*[xX]\s*\]\s*/, '');
      return trimmed.length > 0;
    });

    const existingContents = new Set(todos.map(t => t.content));
    const newTodos: KanbanTodo[] = [];

    for (const line of lines) {
      const content = line.trim().replace(/^[-*]\s*/, '').replace(/^\[\s*[xX]\s*\]\s*/, '');
      if (content && !existingContents.has(content)) {
        newTodos.push({
          id: crypto.randomUUID(),
          content,
          completed: false,
          createdAt: new Date().toISOString(),
        });
        existingContents.add(content);
      }
    }

    if (newTodos.length > 0) {
      const allTodos = [...todos, ...newTodos];
      await saveTodos(allTodos, `智能生成了 ${newTodos.length} 个待办事项`);
      toast.success(`成功添加 ${newTodos.length} 个待办事项`);
    } else {
      toast.info('没有新的待办事项需要添加');
    }

    setAiDialogOpen(false);
    setAiPrompt('');
    setAiResult('');
  };

  const uncompletedCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <Card>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">待办事项</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {uncompletedCount} 未完成 / {completedCount} 已完成
            </span>
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  智能生成
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>智能生成待办事项</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto flex-1">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">任务信息</div>
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{taskTitle}</div>
                      {taskDescription && (
                        <div className="text-gray-500 mt-1 line-clamp-2">{taskDescription}</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">当前待办事项</div>
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg max-h-24 overflow-y-auto">
                      {todos.length === 0 ? '暂无' : todos.map(t => `- ${t.content}`).join('\n')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">提示词</div>
                    <Textarea
                      placeholder="例如：根据任务描述，生成具体的执行步骤..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                  {aiResult && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">生成结果（可编辑）</div>
                      <Textarea
                        value={aiResult}
                        onChange={(e) => setAiResult(e.target.value)}
                        rows={6}
                        className="whitespace-pre-wrap"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 justify-end flex-shrink-0">
                    {aiResult ? (
                      <>
                        <Button variant="outline" onClick={() => setAiResult('')}>
                          重新生成
                        </Button>
                        <Button onClick={handleApplyAiResult} disabled={!aiResult.trim()}>
                          采纳结果
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleAiGenerate} disabled={aiLoading}>
                        {aiLoading ? '生成中...' : '生成'}
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="添加待办事项..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleAddTodo} disabled={saving || !newTodo.trim()}>
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>

        {todos.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            暂无待办事项
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="todo-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {todos.map((todo, index) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            todo.completed
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          } ${snapshot.isDragging ? 'shadow-lg border-blue-400' : ''}`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                          >
                            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                            </svg>
                          </div>

                          <button
                            onClick={() => handleToggleComplete(todo.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              todo.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {todo.completed && <CheckIcon className="w-3 h-3" />}
                          </button>

                          {editingId === todo.id ? (
                            <Input
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                              autoFocus
                              className="flex-1 h-8"
                            />
                          ) : (
                            <span
                              onClick={() => handleStartEdit(todo)}
                              className={`flex-1 text-sm cursor-pointer ${
                                todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                              } hover:text-blue-500`}
                            >
                              {todo.content}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}
