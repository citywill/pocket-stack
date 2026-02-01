import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pb } from '@/lib/pocketbase';
import type { FinanceRecord, FinanceCategory } from '../types';
import { RECORD_TYPE_OPTIONS } from '../types';
import { format } from 'date-fns';

interface FinanceFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FinanceRecord | null;
  onSave: (data: Partial<FinanceRecord>) => void;
  loading?: boolean;
}

export function FinanceFormDrawer({
  open,
  onOpenChange,
  record,
  onSave,
  loading,
}: FinanceFormDrawerProps) {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [formData, setFormData] = useState<Partial<FinanceRecord>>({
    amount: 0,
    type: 'expense',
    category: '',
    date: new Date().toISOString(),
    note: '',
  });

  // 获取分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await pb.collection('finance_categories').getFullList<FinanceCategory>({
          sort: 'name',
        });
        setCategories(result);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        // PocketBase 的日期格式处理
        date: record.date ? new Date(record.date).toISOString() : new Date().toISOString(),
      });
    } else {
      setFormData({
        amount: 0,
        type: 'expense',
        category: categories.find(c => c.type === 'expense')?.id || '',
        date: new Date().toISOString(),
        note: '',
      });
    }
  }, [record, open, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{record ? '编辑记录' : '新增记账'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">类型</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => {
                  const newType = v as 'expense' | 'income';
                  setFormData({
                    ...formData,
                    type: newType,
                    category: categories.find(c => c.type === newType)?.id || ''
                  });
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">金额</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">日期</Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date ? formData.date.slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">备注</Label>
            <Textarea
              id="note"
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="添加备注..."
              className="min-h-[100px]"
            />
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
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
