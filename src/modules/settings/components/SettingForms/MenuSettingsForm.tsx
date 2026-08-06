import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Bars3Icon,
    InformationCircleIcon,
    DocumentCheckIcon
} from '@heroicons/react/24/outline';

interface SystemSetting {
    id: string;
    key: string;
    value: any;
    description: string;
}

export const MENU_PRESET_SETTINGS = [
    { key: 'enable_custom_menu', label: '启用自定义菜单', description: '开启后，将「菜单管理」中定义的菜单合并到默认模块菜单之后显示。' },
];

export const metadata = {
    id: 'menu',
    title: '菜单设置',
    icon: Bars3Icon,
    presetSettings: MENU_PRESET_SETTINGS,
};

interface MenuSettingsFormProps {
    settings: Record<string, SystemSetting>;
    loading: boolean;
    onUpdate: (key: string, value: any) => void;
    onSave: () => void;
}

export function MenuSettingsForm({
    settings,
    loading,
    onUpdate,
    onSave
}: MenuSettingsFormProps) {
    return (
        <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Bars3Icon className="h-5 w-5 text-primary" />
                    菜单设置
                </CardTitle>
                <CardDescription>控制是否启用「菜单管理」中定义的菜单。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-6">
                    {MENU_PRESET_SETTINGS.map((preset) => {
                        const setting = settings[preset.key];
                        if (!setting) return null;
                        const checked = setting.value === true || setting.value === 'true';
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

                                <Switch
                                    id={setting.key}
                                    checked={checked}
                                    onCheckedChange={(v) => onUpdate(setting.key, v)}
                                />

                                {setting.description && (
                                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                                        <InformationCircleIcon className="h-3 w-3" />
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
                            className="bg-primary hover:bg-primary/90 rounded-2xl text-primary-foreground"
                        >
                            <DocumentCheckIcon className="mr-2 h-4 w-4" />
                            {loading ? '保存中...' : '保存菜单设置'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
