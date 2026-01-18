import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { pb } from '@/lib/pocketbase';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface OpportunityFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    opportunityId?: string;
    onSuccess: () => void;
}

export function OpportunityForm({ open, onOpenChange, opportunityId, onSuccess }: OpportunityFormProps) {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const { register, handleSubmit, reset, control } = useForm();

    useEffect(() => {
        if (open) {
            fetchCompanies();
            if (opportunityId) {
                fetchOpportunity();
            } else {
                reset({
                    name: '',
                    company: '',
                    status: '初步接触',
                    amount: 0,
                    probability: 10,
                    expected_close_date: '',
                    description: '',
                });
            }
        }
    }, [opportunityId, open]);

    const fetchCompanies = async () => {
        try {
            const records = await pb.collection('crm_companies').getFullList({
                sort: 'name',
            });
            setCompanies(records);
        } catch (error) {
            console.error('Fetch companies error:', error);
        }
    };

    const fetchOpportunity = async () => {
        try {
            setLoading(true);
            const record = await pb.collection('crm_opportunities').getOne(opportunityId!);
            // 格式化日期以适应 input type="date"
            if (record.expected_close_date) {
                record.expected_close_date = record.expected_close_date.split(' ')[0];
            }
            reset(record);
        } catch (error) {
            toast.error('获取商机信息失败');
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            const userData = pb.authStore.model;
            if (!userData) {
                toast.error('请先登录');
                return;
            }

            const payload = {
                ...data,
                creator: userData.id,
            };

            if (opportunityId) {
                await pb.collection('crm_opportunities').update(opportunityId, payload);
                toast.success('更新成功');
            } else {
                await pb.collection('crm_opportunities').create(payload);
                toast.success('创建成功');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || '保存失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[540px] !max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-xl">{opportunityId ? '编辑商机' : '新增商机'}</SheetTitle>
                    <SheetDescription>
                        填写销售商机的详细信息，以便进行跟进管理。
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">商机名称</Label>
                            <Input id="name" {...register('name', { required: true })} placeholder="请输入商机名称" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company">客户单位</Label>
                            <Controller
                                name="company"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="请选择客户单位" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">预计金额 (¥)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    {...register('amount', { valueAsNumber: true })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="probability">赢单概率 (%)</Label>
                                <Input
                                    id="probability"
                                    type="number"
                                    {...register('probability', { valueAsNumber: true, min: 0, max: 100 })}
                                    placeholder="0-100"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">商机状态</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="请选择状态" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['初步接触', '需求分析', '方案报价', '合同签订', '赢单关闭', '输单关闭'].map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expected_close_date">预计结单日期</Label>
                            <Input
                                id="expected_close_date"
                                type="date"
                                {...register('expected_close_date')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">备注说明</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="请输入商机备注信息..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <SheetFooter className="pt-4 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                            取消
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                            {loading ? '保存中...' : '保存'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
