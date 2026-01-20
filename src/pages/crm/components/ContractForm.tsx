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

interface ContractFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contractId?: string;
    onSuccess: () => void;
}

export function ContractForm({ open, onOpenChange, contractId, onSuccess }: ContractFormProps) {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const { register, handleSubmit, reset, control, watch } = useForm();

    const companyId = watch('company');

    useEffect(() => {
        if (open) {
            fetchCompanies();
            if (contractId) {
                fetchContract();
            } else {
                reset({
                    name: '',
                    code: '',
                    company: '',
                    opportunity: '',
                    amount: 0,
                    sign_date: new Date().toISOString().split(' ')[0],
                    status: '待签订',
                    description: '',
                });
            }
        }
    }, [contractId, open]);

    useEffect(() => {
        if (companyId) {
            fetchOpportunities(companyId);
        } else {
            setOpportunities([]);
        }
    }, [companyId]);

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

    const fetchOpportunities = async (cid: string) => {
        try {
            const records = await pb.collection('crm_opportunities').getFullList({
                filter: `company = "${cid}"`,
                sort: 'name',
            });
            setOpportunities(records);
        } catch (error) {
            console.error('Fetch opportunities error:', error);
        }
    };

    const fetchContract = async () => {
        try {
            setLoading(true);
            const record = await pb.collection('crm_contracts').getOne(contractId!);
            // 格式化日期以适应 input type="date"
            if (record.sign_date) {
                record.sign_date = record.sign_date.split(' ')[0];
            }
            reset(record);
        } catch (error) {
            toast.error('获取合同信息失败');
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
                // 如果没有选择商机，则设为空字符串，PocketBase relation 字段处理
                opportunity: data.opportunity || null,
            };

            if (contractId) {
                await pb.collection('crm_contracts').update(contractId, payload);
                toast.success('更新成功');
            } else {
                await pb.collection('crm_contracts').create(payload);
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
                    <SheetTitle className="text-xl">{contractId ? '编辑合同' : '新增合同'}</SheetTitle>
                    <SheetDescription>
                        填写合同的详细信息，关联客户和商机。
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">合同名称</Label>
                            <Input id="name" {...register('name', { required: true })} placeholder="请输入合同名称" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">合同编号</Label>
                            <Input id="code" {...register('code', { required: true })} placeholder="请输入合同编号" />
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

                        <div className="space-y-2">
                            <Label htmlFor="opportunity">关联商机 (可选)</Label>
                            <Controller
                                name="opportunity"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="请选择商机" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">无关联商机</SelectItem>
                                            {opportunities.map((opp) => (
                                                <SelectItem key={opp.id} value={opp.id}>
                                                    {opp.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">合同金额 (¥)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    {...register('amount', { valueAsNumber: true, required: true })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sign_date">签订日期</Label>
                                <Input
                                    id="sign_date"
                                    type="date"
                                    {...register('sign_date', { required: true })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">合同状态</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="请选择状态" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['待签订', '执行中', '已完成', '已终止'].map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">备注说明</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="请输入合同备注信息..."
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
