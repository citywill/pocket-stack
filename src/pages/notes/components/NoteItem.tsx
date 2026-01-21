import { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
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
  Download01Icon,
  ViewIcon,
  Cancel01Icon,
  ArrowTurnBackwardIcon,
  FileAttachmentIcon,
} from '@hugeicons/core-free-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { NoteEditor } from './NoteEditor';
import type { NoteEditorData } from './NoteEditor';

interface Tag {
  id: string;
  name: string;
}

interface Note {
  id: string;
  content: string;
  user: string;
  attachments?: string[];
  isDeleted?: boolean;
  noted: string;
  created: string;
  updated: string;
  expand?: {
    user: {
      id: string;
      username: string;
      name: string;
      avatar: string;
    },
    'note_tag_links(note)'?: {
      id: string;
      tag: string;
      expand?: {
        tag: Tag;
      }
    }[]
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

  // 获取当前笔记的标签ID列表
  const currentTagIds = note.expand?.['note_tag_links(note)']?.map(link => link.tag) || [];

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleUpdate = async (data: NoteEditorData) => {
    const isContentChanged = data.content.trim() !== note.content;
    const isNotedChanged = data.noted && new Date(data.noted).getTime() !== new Date(note.noted).getTime();

    // 检查附件是否变化
    const currentAttachments = Array.isArray(note.attachments) ? note.attachments : [];
    const isExistingAttachmentsChanged = JSON.stringify(data.existingAttachments?.sort()) !== JSON.stringify(currentAttachments.sort());
    const isNewFilesAdded = data.files.length > 0;
    const isAttachmentsChanged = isExistingAttachmentsChanged || isNewFilesAdded;

    // 检查标签是否变化
    const isTagsChanged = JSON.stringify(data.tagIds.sort()) !== JSON.stringify(currentTagIds.sort());

    if (!data.content.trim()) {
      toast.error('内容不能为空');
      return;
    }

    if (!isContentChanged && !isAttachmentsChanged && !isNotedChanged && !isTagsChanged) {
      setIsEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('noted', data.noted ? new Date(data.noted).toISOString() : new Date().toISOString());

      // 处理附件：PocketBase 更新附件时，如果想保留现有文件并添加新文件，
      // 需要先列出要保留的文件名，然后 append 新的 File 对象。

      // 1. 添加要保留的现有文件名
      if (data.existingAttachments && data.existingAttachments.length > 0) {
        data.existingAttachments.forEach(filename => {
          formData.append('attachments', filename);
        });
      } else {
        // 如果清空了所有附件，发送空字符串或根据 PB 版本可能需要特殊处理
        // 在 PB 中，如果 attachments 字段是多文件，不发送该字段通常意味着保留原样
        // 发送空值或仅发送新文件则会覆盖旧文件。
        // 这里显式设置为空以确保如果 existingAttachments 为空则删除旧文件
        formData.append('attachments', '');
      }

      // 2. 添加新上传的文件
      if (data.files && data.files.length > 0) {
        data.files.forEach(file => {
          formData.append('attachments', file);
        });
      }

      await pb.collection('notes').update(note.id, formData);

      // 更新标签关联
      if (isTagsChanged || (data.tempTags && data.tempTags.length > 0)) {
        // 1. 处理临时标签
        let finalTagIds = [...data.tagIds];
        if (data.tempTags && data.tempTags.length > 0) {
          const tempTagMap: Record<string, string> = {};
          await Promise.all(data.tempTags.map(async (tempTag) => {
            try {
              const existing = await pb.collection('note_tags').getFirstListItem(`name="${tempTag.name}" && user="${user?.id}"`).catch(() => null);
              let tagRecord;
              if (existing) {
                tagRecord = existing;
              } else {
                tagRecord = await pb.collection('note_tags').create({
                  name: tempTag.name,
                  user: user?.id
                });
              }
              tempTagMap[tempTag.id] = tagRecord.id;
            } catch (err) {
              console.error('Failed to create temp tag in update:', tempTag.name, err);
            }
          }));
          finalTagIds = finalTagIds.map(id => tempTagMap[id] || id);
        }

        const validTagIds = finalTagIds.filter(id => !id.startsWith('temp_'));

        // 2. 获取现有链接
        const existingLinks = note.expand?.['note_tag_links(note)'] || [];

        // 2. 找出需要删除的链接
        const linksToDelete = existingLinks.filter(link => !validTagIds.includes(link.tag));
        await Promise.all(linksToDelete.map(link => pb.collection('note_tag_links').delete(link.id, { requestKey: null })));

        // 3. 找出需要添加的链接
        const tagsToAdd = validTagIds.filter(tagId => !currentTagIds.includes(tagId));
        await Promise.all(tagsToAdd.map(tagId => pb.collection('note_tag_links').create({
          note: note.id,
          tag: tagId
        }, { requestKey: null })));
      }

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
                    {note.noted ? formatDistanceToNow(new Date(note.noted), { addSuffix: true, locale: zhCN }) : (note.created ? formatDistanceToNow(new Date(note.created), { addSuffix: true, locale: zhCN }) : '刚刚')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{note.noted ? format(new Date(note.noted), 'yyyy-MM-dd HH:mm:ss') : (note.created ? format(new Date(note.created), 'yyyy-MM-dd HH:mm:ss') : '刚刚')}</p>
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
          <NoteEditor
            noCard
            showDate
            className="mt-2"
            getAttachmentUrl={getFileUrl}
            initialData={{
              content: note.content,
              tagIds: currentTagIds,
              noted: new Date(note.noted).toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T'),
              existingAttachments: Array.isArray(note.attachments) ? note.attachments : []
            }}
            onSubmit={handleUpdate}
            onCancel={cancelEdit}
            submitting={submitting}
            submitLabel="保存"
          />
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
            {/* 标签显示 */}
            {note.expand?.['note_tag_links(note)'] && note.expand['note_tag_links(note)'].length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {note.expand['note_tag_links(note)'].map(link => (
                  link.expand?.tag && (
                    <Badge
                      key={link.id}
                      variant="secondary"
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 font-normal"
                    >
                      #{link.expand.tag.name}
                    </Badge>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {!isEditing && Array.isArray(note.attachments) && note.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.attachments.map((filename) => (
              <div key={filename} className="group relative">
                {isImage(filename) ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer">
                        <img
                          src={getFileUrl(filename)}
                          alt={filename}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className="relative block h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:bg-slate-200 transition-colors group"
                    title={filename}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <HugeiconsIcon icon={FileAttachmentIcon} size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[10px] text-slate-500 mt-1 w-full truncate text-center px-1">{filename}</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <HugeiconsIcon icon={Download01Icon} size={16} className="text-slate-600" />
                    </div>
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
