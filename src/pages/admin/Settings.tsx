import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { useSettings } from '@/lib/use-settings';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
}

// 动态加载所有设置表单组件
const formModules = import.meta.glob('./components/SettingForms/*.tsx', { eager: true });

interface SettingFormModule {
  metadata: {
    id: string;
    title: string;
    icon: any;
    presetSettings: { key: string; label: string; description: string }[];
  };
  [key: string]: any;
}

const FORMS = Object.entries(formModules).map(([path, module]) => {
  const m = module as SettingFormModule;
  // 获取组件名（通常是文件名，或者是 metadata.id 对应的组件）
  // 假设组件是以文件名命名的命名导出，例如 GeneralSettingsForm.tsx 导出 GeneralSettingsForm
  const fileName = path.split('/').pop()?.replace('.tsx', '');
  const Component = m[fileName || ''] || Object.values(m).find(v => typeof v === 'function');

  return {
    ...m.metadata,
    Component
  };
})
  .filter(f => f.Component && f.id)
  .sort((a, b) => {
    // 确保 id 为 'general' 的表单排在第一位
    if (a.id === 'general') return -1;
    if (b.id === 'general') return 1;
    return 0;
  });

const ALL_PRESET_SETTINGS = FORMS.flatMap(f => f.presetSettings);

export function Settings() {
  const { refresh } = useSettings();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const records = await pb.collection('system_settings').getFullList<SystemSetting>({
        requestKey: null // Disable auto-cancellation
      });

      const settingsMap: Record<string, SystemSetting> = {};

      // Initialize with presets (empty values)
      ALL_PRESET_SETTINGS.forEach(preset => {
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
        const data = {
          key: setting.key,
          value: setting.value || "",
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

      <Tabs defaultValue={FORMS[0]?.id || 'general'} className="w-full">
        <TabsList className="mb-6">
          {FORMS.map(form => (
            <TabsTrigger key={form.id} value={form.id}>
              <HugeiconsIcon icon={form.icon} className="w-4 h-4 mr-2" />
              {form.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {FORMS.map(form => (
          <TabsContent key={form.id} value={form.id} className="mt-0 outline-none">
            <form.Component
              settings={settings}
              loading={loading}
              onUpdate={handleUpdateSetting}
              onSave={saveSettings}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
