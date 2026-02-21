import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Post } from '../types';
import { STATUS_OPTIONS } from '../types';
import { format, parseISO } from 'date-fns';
import {
  UserIcon,
  CalendarIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PostDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
}

export function PostDetailDrawer({
  open,
  onOpenChange,
  post,
}: PostDetailDrawerProps) {
  if (!post) return null;

  const statusOption = STATUS_OPTIONS.find((s) => s.value === post.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={cn(statusOption?.color)} variant="secondary">
              {statusOption?.label}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-bold">{post.title}</SheetTitle>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              {post.author}
            </div>
            <div className="flex items-center gap-1">
              <FolderIcon className="h-4 w-4" />
              {post.category}
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {post.created ? format(parseISO(post.created), 'yyyy-MM-dd HH:mm') : '-'}
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <div className="space-y-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {post.content}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-neutral-500">文章 ID</div>
              <div className="font-mono font-medium">{post.id}</div>
            </div>
            <div className="space-y-1">
              <div className="text-neutral-500">最后更新</div>
              <div className="font-medium">
                {post.updated ? format(parseISO(post.updated), 'yyyy-MM-dd HH:mm') : '-'}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
