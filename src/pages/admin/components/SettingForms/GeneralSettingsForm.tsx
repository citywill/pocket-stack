import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    GlobalIcon,
    InformationCircleIcon,
    FloppyDiskIcon
} from '@hugeicons/core-free-icons';

interface SystemSetting {
    id: string;
    key: string;
    value: any;
    description: string;
}

export const GENERAL_PRESET_SETTINGS = [
    { key: 'site_name', label: '系统名称', description: '显示在页面顶部的系统名称' },
    { key: 'contact_email', label: '管理员邮箱', description: '系统管理员的联系邮箱' },
    { key: 'footer_text', label: '页脚文字', description: '显示在页面底部的版权信息' },
];

export const metadata = {
    id: 'general',
    title: '全局配置',
    icon: GlobalIcon,
    presetSettings: GENERAL_PRESET_SETTINGS,
};

interface GeneralSettingsFormProps {
    settings: Record<string, SystemSetting>;
    loading: boolean;
    onUpdate: (key: string, value: any) => void;
    onSave: () => void;
}

export function GeneralSettingsForm({
    settings,
    loading,
    onUpdate,
    onSave
}: GeneralSettingsFormProps) {
    return (
        <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <HugeiconsIcon icon={GlobalIcon} className="h-5 w-5 text-blue-500" />
                    全局基本配置
                </CardTitle>
                <CardDescription>管理系统的基本信息，如名称、联系方式和版权信息。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-6">
                    {GENERAL_PRESET_SETTINGS.map((preset) => {
                        const setting = settings[preset.key];
                        if (!setting) return null;
                        return (
                            <div key={setting.key} className="space-y-2 pb-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={setting.key} className="text-base font-semibold">
                                        {preset.label}
                                    </Label>
                                    <code className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-500">
                                        {setting.key}
                                    </code>
                                </div>

                                {setting.key === 'footer_text' ? (
                                    <秘密Textarea
                                        id={setting.key}
                                        value={setting.value || ''}
                                        onChange={(e) => onUpdate(setting.key, e.target.value)}
                                        placeholder={`请输入 ${preset.label}`}
                                        className="rounded-xl border-neutral-200 min-h-[80px]"
                                    />
                                ) : (
                                    <Input
                                        id={setting.key}
                                        value={setting.value || ''}
                                        onChange={(e) => onUpdate(setting.key, e.target.value)}
                                        placeholder={`请输入 ${preset.label}`}
                                        className="rounded-xl border-neutral-200"
                                    />
                                )}

                                {setting.description && (
                                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                                        <HugeiconsIcon icon={InformationCircleIcon} className="h-3 w-3" />
                                        {setting.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                            onClick={onSave}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 rounded-2xl"
                        >
                            <HugeiconsIcon icon={FloppyDiskIcon} className="mr-2 h-4 w-4" />
                            {loading ? '保存中...' : '保存全局配置'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// 辅助组件处理 Textarea 类型，这里由于之前代码中是直接使用 Textarea，我们保持一致
const 秘密Textarea = Textarea;
