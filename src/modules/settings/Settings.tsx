import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useSettings } from '@/lib/use-settings';
import { toast } from 'sonner';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  collectModuleSettings,
  defaultFieldValue,
  settingKey,
  type ModuleSettingsTab,
} from '@/lib/module-settings';
import { ModuleSettingsForm, type SettingEntry } from './components/ModuleSettingsForm';
import { SYSTEM_GLOBAL_SETTINGS } from './systemSettings';

/** 系统内置 + 各模块自动注册的设置 Tab */
const MODULE_SETTINGS_TABS: ModuleSettingsTab[] = [
  SYSTEM_GLOBAL_SETTINGS,
  ...collectModuleSettings(),
].sort((a, b) => a.order - b.order || a.moduleName.localeCompare(b.moduleName));

export function Settings() {
  const { refresh } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Record<string, SettingEntry>>({});

  const loadSettings = async () => {
    try {
      const records = await pb.collection('system_settings').getFullList<any>({
        requestKey: null,
      });

      const recordMap: Record<string, any> = {};
      records.forEach((record) => {
        recordMap[record.key] = record;
      });

      const next: Record<string, SettingEntry> = {};
      MODULE_SETTINGS_TABS.forEach((tab) => {
        tab.fields.forEach((field) => {
          const key = settingKey(tab.moduleName, field.key);
          const record = recordMap[key];
          next[key] = {
            id: record?.id ?? '',
            value: record ? record.value : defaultFieldValue(field),
          };
        });
      });

      setEntries(next);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Fetch settings error:', error);
        toast.error('获取系统设置失败');
      }
    }
  };

  useEffect(() => {
    loadSettings().finally(() => setLoading(false));
  }, []);

  const handleUpdate = (key: string, value: any) => {
    setEntries((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { id: '' }), value },
    }));
  };

  const saveTab = async (tab: ModuleSettingsTab) => {
    try {
      setSaving(true);
      const promises = tab.fields.map(async (field) => {
        const key = settingKey(tab.moduleName, field.key);
        const entry = entries[key];
        const data = {
          key,
          value: entry?.value ?? defaultFieldValue(field),
          description: field.description ?? '',
        };

        if (entry?.id) {
          return pb.collection('system_settings').update(entry.id, data, { requestKey: null });
        }
        return pb.collection('system_settings').create(data, { requestKey: null });
      });

      await Promise.all(promises);
      await refresh();
      await loadSettings();
      toast.success(`${tab.title}已保存`);
    } catch (error: any) {
      console.error('Save settings error:', error);
      toast.error(`保存设置失败: ${error?.message || '未知错误'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载配置中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            <Cog6ToothIcon className="h-8 w-8 text-primary" />
            系统设置
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            模块可在其目录下提供 settings.tsx 自动注册为本页 Tab，字段 key 自动带模块名前缀。
          </p>
        </div>
      </div>

      <Tabs defaultValue={MODULE_SETTINGS_TABS[0]?.moduleName} className="w-full">
        <TabsList className="mb-6">
          {MODULE_SETTINGS_TABS.map((tab) => (
            <TabsTrigger key={tab.moduleName} value={tab.moduleName}>
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {MODULE_SETTINGS_TABS.map((tab) => (
          <TabsContent key={tab.moduleName} value={tab.moduleName} className="mt-0 outline-none">
            <ModuleSettingsForm
              tab={tab}
              entries={entries}
              saving={saving}
              onUpdate={handleUpdate}
              onSave={() => saveTab(tab)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
