import React, { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HugeiconsIcon } from '@hugeicons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Delete02Icon,
  PencilEdit01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  user: string;
  created: string;
  updated: string;
  expand?: {
    user: {
      id: string;
      username: string;
      name: string;
      avatar: string;
    }
  }
}

interface NoteItemProps {
  note: Note;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export function NoteItem({ note, onDelete, onUpdate }: NoteItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [submitting, setSubmitting] = useState(false);

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUpdate();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(note.content);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || editContent === note.content) {
      setIsEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      await pb.collection('notes').update(note.id, {
        content: editContent,
      });
      toast.success('更新成功');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to update note:', error);
        toast.error('更新失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 transition-colors bg-white border-1 rounded-2xl mb-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              {formatDistanceToNow(new Date(note.created), { addSuffix: true, locale: zhCN })}
            </span>
          </div>
          {user?.id === note.user && (
            <div className="flex gap-1">
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(note.content);
                  }}
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(note.id)}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              autoFocus
              className="min-h-[100px] resize-none focus-visible:ring-1 text-[15px] p-2 bg-muted/50 rounded-xl border-none"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(note.content);
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} className="mr-1" />
                取消
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleUpdate}
                disabled={submitting || !editContent.trim()}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mr-1" />
                保存
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-[15px] leading-relaxed break-words prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-1" {...props} />,
                code: ({ node, ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                pre: ({ node, ...props }) => <pre className="bg-muted p-3 rounded-xl overflow-x-auto mb-2 font-mono text-sm" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-muted pl-4 italic mb-2" {...props} />,
                a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border-collapse border border-muted" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
                th: ({ node, ...props }) => <th className="border border-muted px-4 py-2 text-left font-bold" {...props} />,
                td: ({ node, ...props }) => <td className="border border-muted px-4 py-2" {...props} />,
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
