import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import type { Objective } from '../types';

interface ObjectiveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okrId: string;
  objective: Objective | null;
  onSuccess: () => void;
}

export function ObjectiveFormDialog({ open, onOpenChange, okrId, objective, onSuccess }: ObjectiveFormDialogProps) {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<Partial<Objective>>();

  useEffect(() => {
    if (objective?.id) {
      reset({ name: objective.name });
    } else {
      reset({ name: '' });
    }
  }, [objective, reset, open]);

  const onSubmit = async (data: Partial<Objective>) => {
    if (!user) return;
    try {
      const payload = { ...data, okr: okrId, user: user.id };
      if (objective?.id) {
        await pb.collection('okr_objectives').update(objective.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection('okr_objectives').create(payload);
        toast.success('创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('保存失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{objective ? '编辑目标' : '添加目标'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="obj-name">目标名称</Label>
            <Input id="obj-name" {...register('name', { required: true })} placeholder="描述您要达成的目标" className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">取消</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
