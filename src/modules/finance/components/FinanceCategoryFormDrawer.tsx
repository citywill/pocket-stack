import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
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
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { FinanceCategory } from '../types';

interface FinanceCategoryFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: FinanceCategory | null;
  onSuccess: () => void;
}

export function FinanceCategoryFormDrawer({
  open,
  onOpenChange,
  category,
  onSuccess,
}: FinanceCategoryFormDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<FinanceCategory>>({
    name: '',
    type: 'expense',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
      });
    } else {
      setFormData({
        name: '',
        type: 'expense',
      });
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('请输入分类名称');
      return;
    }

    setLoading(true);
    try {
      if (category) {
        await pb.collection('finance_categories').update(category.id, formData);
        toast.success('分类更新成功');
      } else {
        await pb.collection('finance_categories').create(formData);
        toast.success('分类创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{category ? '编辑分类' : '新增分类'}</SheetTitle>
          <SheetDescription>
            {category ? '修改现有的财务分类信息。' : '创建一个新的财务分类用于记账。'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">分类名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：餐饮、交通"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">类型</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'expense' | 'income') =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">支出</SelectItem>
                <SelectItem value="income">收入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
