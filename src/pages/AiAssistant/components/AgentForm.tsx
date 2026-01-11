import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, ImageAdd01Icon } from '@hugeicons/core-free-icons';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface Agent {
    id: string;
    name: string;
    description: string;
    system_prompt: string;
    avatar?: string | FileList;
}

interface AgentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agentId?: string;
    onSuccess: () => void;
}

export function AgentForm({ open, onOpenChange, agentId, onSuccess }: AgentFormProps) {
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { register, handleSubmit, reset, watch, setValue } = useForm<Partial<Agent>>();

    const avatarFile = watch('avatar');

    useEffect(() => {
        if (avatarFile instanceof FileList && avatarFile.length > 0) {
            const file = avatarFile[0];
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [avatarFile]);

    useEffect(() => {
        if (agentId && open) {
            fetchAgent();
        } else if (open) {
            reset({
                name: '',
                description: '',
                system_prompt: '',
                avatar: undefined,
            });
            setPreviewUrl(null);
        }
    }, [agentId, open]);

    const fetchAgent = async () => {
        try {
            setLoading(true);
            const record = await pb.collection('ai_agents').getOne(agentId!, {
                requestKey: null
            });
            reset(record);
            if (record.avatar) {
                setPreviewUrl(pb.files.getURL(record, record.avatar));
            }
        } catch (error) {
            toast.error('获取智能体信息失败');
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: Partial<Agent>) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', data.name || '');
            formData.append('description', data.description || '');
            formData.append('system_prompt', data.system_prompt || '');

            if (data.avatar instanceof FileList && data.avatar.length > 0) {
                formData.append('avatar', data.avatar[0]);
            }

            if (agentId) {
                await pb.collection('ai_agents').update(agentId, formData);
                toast.success('更新成功');
            } else {
                await pb.collection('ai_agents').create(formData);
                toast.success('创建成功');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error(agentId ? '更新失败' : '创建失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] flex flex-col h-full p-0">
                <div className="p-6 border-b">
                    <SheetHeader>
                        <SheetTitle>{agentId ? '编辑智能体' : '新增智能体'}</SheetTitle>
                        <SheetDescription>
                            设置智能体的名称、描述和系统提示词。系统提示词将决定智能体的人设和行为。
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <Label className="text-sm font-medium text-neutral-500 self-start">智能体头像</Label>
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar className="h-24 w-24 border-2 border-neutral-100 dark:border-neutral-800 transition-all group-hover:opacity-80">
                                    <AvatarImage src={previewUrl || ''} />
                                    <AvatarFallback className="bg-neutral-50 dark:bg-neutral-900">
                                        <HugeiconsIcon icon={ImageAdd01Icon} className="h-8 w-8 text-neutral-400" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <HugeiconsIcon icon={Camera01Icon} className="h-6 w-6 text-white" />
                                </div>
                                <input
                                    type="file"
                                    id="avatar"
                                    accept="image/*"
                                    className="hidden"
                                    {...register('avatar')}
                                    ref={(e) => {
                                        register('avatar').ref(e);
                                        // @ts-ignore
                                        fileInputRef.current = e;
                                    }}
                                />
                            </div>
                            <p className="text-xs text-neutral-400">点击头像上传图片</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">名称</Label>
                                <Input
                                    id="name"
                                    placeholder="例如：翻译助手"
                                    className="h-11 rounded-xl"
                                    {...register('name', { required: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">简短描述</Label>
                                <Input
                                    id="description"
                                    placeholder="简要说明智能体的功能"
                                    className="h-11 rounded-xl"
                                    {...register('description')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="system_prompt">系统提示词 (System Prompt)</Label>
                                <Textarea
                                    id="system_prompt"
                                    placeholder="你是一个专业的翻译官..."
                                    className="min-h-[200px] rounded-xl resize-none p-4"
                                    {...register('system_prompt', { required: true })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t bg-neutral-50/50 dark:bg-neutral-950/50">
                        <SheetFooter className="gap-3 sm:gap-0 space-y-3">
                            <Button type="button" variant="outline" className="rounded-xl px-8" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button type="submit" className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" disabled={loading}>
                                {loading ? '保存中...' : '保存'}
                            </Button>
                        </SheetFooter>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
