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
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import type { Kr, Objective } from '../types';

interface KrFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okrId: string;
  objectives: Objective[];
  kr: Kr | null;
  onSuccess: () => void;
}

export function KrFormDialog({ open, onOpenChange, okrId, objectives, kr, onSuccess }: KrFormDialogProps) {
  const { user } = useAuth();
  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Kr>>({
    defaultValues: {
      objectives: '',
    }
  });

  const selectedObjective = watch('objectives');

  useEffect(() => {
    if (open) {
      if (kr) {
        reset({
          name: kr.name || '',
          target_value: kr.target_value || 0,
          current_value: kr.current_value || 0,
          unit: kr.unit || '',
          objectives: Array.isArray(kr.objectives) ? kr.objectives[0] : (kr.objectives || ''),
        });
      } else {
        reset({
          name: '',
          target_value: 0,
          current_value: 0,
          unit: '',
          objectives: '',
        });
      }
    }
  }, [kr, reset, open]);

  const onSubmit = async (data: Partial<Kr>) => {
    if (!user) return;
    if (!data.objectives) {
      toast.error('请选择一个关联目标');
      return;
    }
    try {
      // 数据库中 objectives 字段可能是非数组，或者是包含单个 ID 的数组，
      // 这里统一转换为包含单个 ID 的数组以匹配 pocketbase 集合配置
      const payload = { ...data, okr: okrId, user: user.id, objectives: [data.objectives] };
      if (kr?.id) {
        await pb.collection('okr_krs').update(kr.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection('okr_krs').create(payload);
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
          <DialogTitle>{kr ? '编辑关键结果' : '添加关键结果'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="kr-name">名称</Label>
            <Input id="kr-name" {...register('name', { required: true })} placeholder="描述可衡量的结果" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">目标值</Label>
              <Input id="target" type="number" {...register('target_value', { required: true, valueAsNumber: true })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current">当前值</Label>
              <Input id="current" type="number" {...register('current_value', { required: true, valueAsNumber: true })} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">单位</Label>
            <Input id="unit" {...register('unit')} placeholder="例如：%, 元, 次" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label>关联目标</Label>
            <div className="max-h-40 overflow-y-auto rounded-xl border p-3">
              <RadioGroup
                value={selectedObjective as string}
                onValueChange={(value) => setValue('objectives', value)}
                className="space-y-2"
              >
                {objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={obj.id}
                      id={`obj-${obj.id}`}
                    />
                    <Label htmlFor={`obj-${obj.id}`} className="text-sm font-normal cursor-pointer flex-1">
                      {obj.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {objectives.length === 0 && <p className="text-xs text-neutral-400">请先创建目标</p>}
            </div>
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
