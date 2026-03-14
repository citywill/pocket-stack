import { useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import type { KanbanTodo } from '../types';

interface TodoListProps {
  taskId: string;
  todos: KanbanTodo[];
  onTodosChange: (todos: KanbanTodo[]) => void;
}

export function TodoList({ taskId, todos, onTodosChange }: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newTodos = [...todos];
    [newTodos[index - 1], newTodos[index]] = [newTodos[index], newTodos[index - 1]];
    await saveTodos(newTodos);
  };

  const handleMoveDown = async (index: number) => {
    if (index === todos.length - 1) return;
    const newTodos = [...todos];
    [newTodos[index], newTodos[index + 1]] = [newTodos[index + 1], newTodos[index]];
    await saveTodos(newTodos);
  };

  const uncompletedCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <Card>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">待办事项</CardTitle>
          <span className="text-xs text-gray-500">
            {uncompletedCount} 未完成 / {completedCount} 已完成
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
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
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {todos.map((todo, index) => (
              <div
                key={todo.id}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  todo.completed
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
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

                <span
                  className={`flex-1 text-sm ${
                    todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}
                >
                  {todo.content}
                </span>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === todos.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
