import React, { useState, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HugeiconsIcon } from '@hugeicons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Delete02Icon,
  PencilEdit01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Download01Icon,
  FileAttachmentIcon,
  ViewIcon,
  Image01Icon,
  ArrowTurnBackwardIcon
} from '@hugeicons/core-free-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  user: string;
  attachments?: string[];
  isDeleted?: boolean;
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
  onRestore?: (id: string) => void;
}

export function NoteItem({ note, onDelete, onUpdate, onRestore }: NoteItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [submitting, setSubmitting] = useState(false);
  const attachmentsArray = Array.isArray(note.attachments) ? note.attachments : [];
  const [existingAttachments, setExistingAttachments] = useState<string[]>(attachmentsArray);
  const [deletedAttachments, setDeletedAttachments] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUpdate();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const startEditing = () => {
    setEditContent(note.content);
    const attachmentsArray = Array.isArray(note.attachments) ? note.attachments : [];
    setExistingAttachments(attachmentsArray);
    setDeletedAttachments([]);
    setNewFiles([]);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(note.content);
    const attachmentsArray = Array.isArray(note.attachments) ? note.attachments : [];
    setExistingAttachments(attachmentsArray);
    setDeletedAttachments([]);
    setNewFiles([]);
  };

  const handleUpdate = async () => {
    const isContentChanged = editContent.trim() !== note.content;
    const isAttachmentsChanged = deletedAttachments.length > 0 || newFiles.length > 0;

    if (!editContent.trim()) {
      toast.error('内容不能为空');
      return;
    }

    if (!isContentChanged && !isAttachmentsChanged) {
      setIsEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      // 构造更新数据
      // 在 PocketBase 中，更新多文件字段时，如果传递一个数组：
      // 1. 数组中的字符串会被视为要保留的现有文件名
      // 2. 数组中的 File/Blob 对象会被视为要新增的文件
      // 3. 不在数组中的现有文件将被删除
      const data: any = {
        content: editContent,
        attachments: [
          ...existingAttachments, // 保留的现有附件（文件名字符串）
          ...newFiles            // 新增的附件（File 对象）
        ]
      };

      await pb.collection('notes').update(note.id, data);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFiles(prev => [...prev, ...files]);
    }
  };

  const removeExistingAttachment = (filename: string) => {
    setExistingAttachments(prev => prev.filter(f => f !== filename));
    setDeletedAttachments(prev => [...prev, filename]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileUrl = (filename: string) => {
    return pb.files.getURL(note, filename);
  };

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
  };

  return (
    <div className="p-4 transition-colors bg-white border-1 rounded-2xl mb-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground text-sm whitespace-nowrap cursor-help">
                    {note.created ? formatDistanceToNow(new Date(note.created), { addSuffix: true, locale: zhCN }) : '刚刚'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{note.created ? format(new Date(note.created), 'yyyy-MM-dd HH:mm:ss') : '刚刚'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {user?.id === note.user && (
            <div className="flex gap-1">
              {note.isDeleted ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                    onClick={() => onRestore?.(note.id)}
                    title="恢复"
                  >
                    <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(note.id)}
                    title="彻底删除"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  </Button>
                </>
              ) : (
                <>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                      onClick={startEditing}
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
                </>
              )}
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

            {/* 编辑模式下的附件管理 */}
            <div className="space-y-3 py-2">
              {/* 现有附件 */}
              {existingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((filename) => (
                    <div key={filename} className="flex items-center gap-2 p-1.5 pl-2 rounded-lg border border-muted bg-muted/30 group">
                      <HugeiconsIcon icon={isImage(filename) ? Image01Icon : FileAttachmentIcon} size={14} className="text-blue-500" />
                      <span className="text-xs max-w-[100px] truncate">{filename}</span>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(filename)}
                        className="text-muted-foreground hover:text-destructive p-0.5 rounded-full hover:bg-destructive/10 transition-colors"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 新选附件 */}
              {newFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-1.5 pl-2 rounded-lg border border-blue-500/20 bg-blue-500/5 group">
                      <HugeiconsIcon icon={FileAttachmentIcon} size={14} className="text-blue-500" />
                      <span className="text-xs max-w-[100px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="text-muted-foreground hover:text-destructive p-0.5 rounded-full hover:bg-destructive/10 transition-colors"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs h-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <HugeiconsIcon icon={Image01Icon} size={14} className="mr-1.5" />
                  上传附件
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={cancelEdit}
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

        {Array.isArray(note.attachments) && note.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.attachments.map((filename) => (
              <div key={filename} className="group relative">
                {isImage(filename) ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-muted bg-muted cursor-pointer">
                        <img
                          src={getFileUrl(filename)}
                          alt={filename}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <HugeiconsIcon icon={ViewIcon} size={20} className="text-white" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent
                      className="sm:max-w-[90vw] max-w-[90vw] w-screen h-screen p-0 overflow-hidden bg-black/70 backdrop-blur-xl border-none shadow-none flex flex-col items-center justify-center rounded-none ring-0"
                      showCloseButton={false}
                    >
                      <DialogTitle className="sr-only">图片预览</DialogTitle>
                      {/* 右上角关闭按钮 */}
                      <DialogPrimitive.Close className="absolute top-6 right-6 z-50 rounded-full p-3 bg-black text-white border border-white/30 group/close outline-none">
                        <HugeiconsIcon icon={Cancel01Icon} size={28} className="drop-shadow-md" />
                      </DialogPrimitive.Close>
                      <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img
                          src={getFileUrl(filename)}
                          alt={filename}
                          className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="rounded-full bg-black text-white px-10 h-12"
                            asChild
                          >
                            <a href={getFileUrl(filename)} target="_blank" rel="noopener noreferrer">
                              <HugeiconsIcon icon={Download01Icon} size={20} className="mr-2" />
                              下载原图
                            </a>
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <a
                    href={getFileUrl(filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border border-muted bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <HugeiconsIcon icon={FileAttachmentIcon} size={16} className="text-blue-500" />
                    <span className="text-xs max-w-[120px] truncate">{filename}</span>
                    <HugeiconsIcon icon={Download01Icon} size={14} className="text-muted-foreground" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
