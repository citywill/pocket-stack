import { useState, useCallback, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { KanbanTodo } from '../types';

interface TodoListProps {
  taskId: string;
  todos: KanbanTodo[];
  onTodosChange: (todos: KanbanTodo[]) => void;
}

export function TodoList({ taskId, todos, onTodosChange }: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
