import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AiChat02Icon,
  InformationCircleIcon,
  FloppyDiskIcon,
  ViewIcon,
  ViewOffIcon
} from '@hugeicons/core-free-icons';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
}

export const AI_PRESET_SETTINGS = [
  { key: 'ai_api_key', label: 'AI API Key', description: '大模型 API 密钥 (如 DeepSeek)' },
  { key: 'ai_api_url', label: 'AI API URL', description: '大模型接口地址 (默认: https://api.deepseek.com/v1/chat/completions)' },
  { key: 'ai_model', label: 'AI 模型名称', description: '使用的模型 ID (默认: deepseek-chat)' },
];

interface AiSettingsFormProps {
  settings: Record<string, SystemSetting>;
  loading: boolean;
  onUpdate: (key: string, value: any) => void;
  onSave: () => void;
}

export function AiSettingsForm({
  settings,
  loading,
  onUpdate,
  onSave
}: AiSettingsFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HugeiconsIcon icon={AiChat02Icon} className="h-5 w-5 text-blue-500" />
          AI 接口配置
        </CardTitle>
        <CardDescription>管理大模型 API 接口参数，配置后可启用真实对话功能。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {AI_PRESET_SETTINGS.map((preset) => {
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

                {setting.key === 'ai_api_key' ? (
                  <InputGroup>
                    <Input
                      id={setting.key}
                      type={showApiKey ? 'text' : 'password'}
                      value={setting.value || ''}
                      onChange={(e) => onUpdate(setting.key, e.target.value)}
                      placeholder={`请输入 ${preset.label}`}
                      className="rounded-xl border-neutral-200"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        onClick={() => setShowApiKey(!showApiKey)}
                        title={showApiKey ? "隐藏密钥" : "显示密钥"}
                      >
                        <HugeiconsIcon
                          icon={showApiKey ? ViewOffIcon : ViewIcon}
                          className="h-4 w-4"
                        />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                ) : (
                  <Input
                    id={setting.key}
                    type="text"
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
              {loading ? '保存中...' : '保存 AI 配置'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
