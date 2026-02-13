import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import type { Okr, OkrStatus } from '../types';
import { OKR_STATUS_OPTIONS } from '../types';

interface OkrFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okr: Okr | null;
  onSuccess: () => void;
}

export function OkrFormDrawer({ open, onOpenChange, okr, onSuccess }: OkrFormDrawerProps) {
  const { user } = useAuth();
  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Okr>>({
    defaultValues: {
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: '未开始' as OkrStatus,
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (okr) {
      reset({
        name: okr.name,
        description: okr.description,
        start_date: okr.start_date ? new Date(okr.start_date).toISOString().split('T')[0] : '',
        end_date: okr.end_date ? new Date(okr.end_date).toISOString().split('T')[0] : '',
        status: okr.status,
      });
    } else {
      reset({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: '未开始' as OkrStatus,
      });
    }
  }, [okr, reset, open]);

  const onSubmit = async (data: Partial<Okr>) => {
    if (!user) return;
    try {
      const payload = {
        ...data,
        user: user.id,
      };

      if (okr) {
        await pb.collection('okr_okrs').update(okr.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection('okr_okrs').create(payload);
        toast.success('创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{okr ? '编辑 OKR' : '创建 OKR'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">OKR 名称</Label>
            <Input
              id="name"
              placeholder="例如：提升产品市场份额"
              {...register('name', { required: true })}
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">开始日期</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date', { required: true })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">结束日期</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date', { required: true })}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value as OkrStatus)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {OKR_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">详情描述</Label>
            <Textarea
              id="description"
              placeholder="描述这个 OKR 的背景和目标..."
              {...register('description')}
              className="min-h-[100px] rounded-xl"
            />
          </div>
          <SheetFooter className="mt-8 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              取消
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              保存
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
