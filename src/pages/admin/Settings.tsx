import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { useSettings } from '@/lib/use-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Settings01Icon,
  FloppyDiskIcon,
  GlobalIcon,
  InformationCircleIcon,
  AiChat02Icon,
  ViewIcon,
  ViewOffIcon
} from '@hugeicons/core-free-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
}

const PRESET_SETTINGS = [
  { key: 'site_name', label: '系统名称', description: '显示在页面顶部的系统名称' },
  { key: 'contact_email', label: '管理员邮箱', description: '系统管理员的联系邮箱' },
  { key: 'footer_text', label: '页脚文字', description: '显示在页面底部的版权信息' },
  { key: 'ai_api_key', label: 'AI API Key', description: '大模型 API 密钥 (如 DeepSeek)' },
  { key: 'ai_api_url', label: 'AI API URL', description: '大模型接口地址 (默认: https://api.deepseek.com/v1/chat/completions)' },
  { key: 'ai_model', label: 'AI 模型名称', description: '使用的模型 ID (默认: deepseek-chat)' },
];

export function Settings() {
  const { refresh } = useSettings();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [showApiKey, setShowApiKey] = useState(false);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const records = await pb.collection('system_settings').getFullList<SystemSetting>({
        requestKey: null // Disable auto-cancellation
      });

      const settingsMap: Record<string, SystemSetting> = {};

      // Initialize with presets (empty values)
      PRESET_SETTINGS.forEach(preset => {
        settingsMap[preset.key] = {
          id: '',
          key: preset.key,
          value: '',
          description: preset.description
        };
      });

      // Overlay with database records
      records.forEach(record => {
        settingsMap[record.key] = record;
      });

      setSettings(settingsMap);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Fetch settings error:', error);
        toast.error('获取系统设置失败');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // Process all settings, allowing empty values for both new and existing records.
      const settingsToSave = Object.values(settings);

      if (settingsToSave.length === 0) {
        toast.info('没有需要保存的配置');
        return;
      }

      const promises = settingsToSave.map(async (setting) => {
        // PocketBase JSON field requires a valid JSON value.
        // For strings, we need to wrap them in quotes if we want to store them as JSON strings,
        // or just pass them directly if they are already valid JSON.
        // In our case, these are simple text values being stored in a JSON field.
        const data = {
          key: setting.key,
          value: setting.value || "", // PocketBase JSON field accepts "" as a valid JSON string
          description: setting.description || ''
        };

        if (setting.id) {
          return pb.collection('system_settings').update(setting.id, data);
        } else {
          return pb.collection('system_settings').create(data);
        }
      });

      await Promise.all(promises);
      await refresh();
      await fetchSettings(); // Refresh local state to get new IDs
      toast.success('系统设置已保存');
    } catch (error: any) {
      console.error('Save settings error:', error);
      toast.error(`保存设置失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载配置中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <HugeiconsIcon icon={Settings01Icon} className="h-8 w-8 text-blue-600" />
            系统设置
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            管理系统的全局基本配置、AI 接口参数等。
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">
            <HugeiconsIcon icon={GlobalIcon} className="w-4 h-4 mr-2" />
            全局配置
          </TabsTrigger>
          <TabsTrigger value="ai">
            <HugeiconsIcon icon={AiChat02Icon} className="w-4 h-4 mr-2" />
            AI 配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0 outline-none">
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
                {PRESET_SETTINGS.filter(s => !s.key.startsWith('ai_')).map((preset) => {
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
                        <Textarea
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={(e) => handleUpdateSetting(setting.key, e.target.value)}
                          placeholder={`请输入 ${preset.label}`}
                          className="rounded-xl border-neutral-200 min-h-[80px]"
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={(e) => handleUpdateSetting(setting.key, e.target.value)}
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
                    onClick={saveSettings}
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
        </TabsContent>

        <TabsContent value="ai" className="mt-0 outline-none">
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
                {PRESET_SETTINGS.filter(s => s.key.startsWith('ai_')).map((preset) => {
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
                            onChange={(e) => handleUpdateSetting(setting.key, e.target.value)}
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
                          onChange={(e) => handleUpdateSetting(setting.key, e.target.value)}
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
                    onClick={saveSettings}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
