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
import { MapPicker } from '../../../components/ui/map-picker';

interface CompanyFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyId?: string;
    onSuccess: () => void;
}

export function CompanyForm({ open, onOpenChange, companyId, onSuccess }: CompanyFormProps) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, watch, control } = useForm();

    const typeValue = watch('type');
    const levelValue = watch('level');
    const statusValue = watch('status');

    useEffect(() => {
        if (companyId && open) {
            fetchCompany();
        } else if (open) {
            reset({
                name: '',
                code: '',
                type: '企业',
                industry: '',
                level: '普通',
                status: '活跃',
                contact_person: '',
                contact_phone: '',
                email: '',
                address: '',
                website: '',
                description: '',
            });
        }
    }, [companyId, open]);

    const fetchCompany = async () => {
        try {
            setLoading(true);
            const record = await pb.collection('crm_companies').getOne(companyId!);
            reset(record);
        } catch (error) {
            toast.error('获取单位信息失败');
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

            // Ensure location values are valid numbers and handle 0 values correctly
            const location =
                data.location &&
                    typeof data.location.lat === 'number' &&
                    typeof data.location.lon === 'number'
                    ? { lat: data.location.lat, lon: data.location.lon }
                    : null;

            const payload = {
                ...data,
                creator: userData.id,
            };

            // Remove location from spread if it exists and use the validated one
            if (payload.location) {
                delete payload.location;
            }

            // Explicitly set location as a top-level property for PocketBase
            if (location) {
                payload.location = location;
            }

            console.log('Final Payload for PocketBase:', JSON.stringify(payload, null, 2));

            if (companyId) {
                await pb.collection('crm_companies').update(companyId, payload);
                toast.success('更新成功');
            } else {
                await pb.collection('crm_companies').create(payload);
                toast.success('创建成功');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error.message || '保存失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[540px] !max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-xl">{companyId ? '编辑客户单位' : '新增客户单位'}</SheetTitle>
                    <SheetDescription>
                        填写客户单位的详细信息。
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">单位名称</Label>
                            <Input id="name" {...register('name', { required: true })} placeholder="请输入单位全称" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">统一社会信用代码</Label>
                            <Input id="code" {...register('code')} placeholder="请输入信用代码" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">单位类型</Label>
                            <Select
                                value={typeValue}
                                onValueChange={(val) => setValue('type', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="请选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="企业">企业</SelectItem>
                                    <SelectItem value="政府机构">政府机构</SelectItem>
                                    <SelectItem value="个人">个人</SelectItem>
                                    <SelectItem value="其他">其他</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">所属行业</Label>
                            <Input id="industry" {...register('industry')} placeholder="如：互联网" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level">客户等级</Label>
                            <Select
                                value={levelValue}
                                onValueChange={(val) => setValue('level', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="请选择等级" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="普通">普通</SelectItem>
                                    <SelectItem value="重要">重要</SelectItem>
                                    <SelectItem value="核心">核心</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">状态</Label>
                            <Select
                                value={statusValue}
                                onValueChange={(val) => setValue('status', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="请选择状态" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="活跃">活跃</SelectItem>
                                    <SelectItem value="流失">流失</SelectItem>
                                    <SelectItem value="潜客">潜客</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_person">主要联系人</Label>
                            <Input id="contact_person" {...register('contact_person')} placeholder="联系人姓名" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">联系电话</Label>
                            <Input id="contact_phone" {...register('contact_phone')} placeholder="联系电话" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">电子邮箱</Label>
                            <Input id="email" type="email" {...register('email')} placeholder="example@mail.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">单位官网</Label>
                            <Input id="website" {...register('website')} placeholder="https://" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">详细地址</Label>
                            <Input id="address" {...register('address')} placeholder="请输入详细地址" />
                        </div>
                        <div className="space-y-2">
                            <Label>地理位置 (点击地图选择)</Label>
                            <Controller
                                name="location"
                                control={control}
                                render={({ field }) => (
                                    <MapPicker
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            <div className="flex gap-2 text-xs text-neutral-500">
                                <span>纬度: {watch('location.lat') != null ? watch('location.lat').toFixed(6) : '-'}</span>
                                <span>经度: {watch('location.lon') != null ? watch('location.lon').toFixed(6) : '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">备注/简介</Label>
                        <Textarea id="description" {...register('description')} placeholder="请输入备注信息" className="min-h-[100px]" />
                    </div>
                    <SheetFooter className="p-0">
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
