import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { defaultFieldValue, settingKey, type ModuleSettingsTab, type SettingField } from '@/lib/module-settings';

/** 设置记录（key 为完整 key：{moduleName}_{fieldKey}） */
export interface SettingEntry {
  id: string;
  value: any;
}

interface ModuleSettingsFormProps {
  tab: ModuleSettingsTab;
  entries: Record<string, SettingEntry>;
  saving: boolean;
  onUpdate: (fullKey: string, value: any) => void;
  onSave: () => void;
}

function toBoolean(value: any): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

/**
 * 模块设置自动渲染表单：根据 settings.tsx 中声明的 fields 自动渲染对应控件。
 * 字段 key 已自动加上 `{模块名}_` 前缀。
 */
export function ModuleSettingsForm({
  tab,
  entries,
  saving,
  onUpdate,
  onSave
}: ModuleSettingsFormProps) {
  return (
    <div className="space-y-6">
      {tab.description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {tab.description}
        </p>
      )}

      <div className="space-y-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:bg-neutral-900/50">
        {tab.fields.map((field) => {
          const fullKey = settingKey(tab.moduleName, field.key);
          const entry = entries[fullKey];
          const value = entry?.value === undefined ? defaultFieldValue(field) : entry.value;
          return (
            <div key={fullKey} className="space-y-2 border-b border-neutral-100 pb-4 last:border-0 last:pb-0 dark:border-neutral-800">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor={fullKey} className="text-base font-semibold">
                  {field.label}
                </Label>
                <code className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-500 dark:bg-neutral-800">
                  {fullKey}
                </code>
              </div>

              <div className="pt-1">
                {renderField(field, fullKey, value, (next) => onUpdate(fullKey, next))}
              </div>

              {field.description && (
                <p className="flex items-center gap-1 text-xs text-neutral-500">
                  <InformationCircleIcon className="h-3 w-3" />
                  {field.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={saving}
          className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  );
}

function renderField(
  field: SettingField,
  id: string,
  value: any,
  onChange: (next: any) => void
) {
  const inputClass = 'rounded-xl border-neutral-200 dark:border-neutral-700';

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? `请输入 ${field.label}`}
          className={`${inputClass} min-h-[80px]`}
        />
      );

    case 'number':
      return (
        <Input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? undefined : Number(raw));
          }}
          placeholder={field.placeholder ?? `请输入 ${field.label}`}
          className={inputClass}
        />
      );

    case 'switch':
      return (
        <Switch
          id={id}
          checked={toBoolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );

    case 'select':
      return (
        <Select
          value={value === undefined || value === '' ? undefined : String(value)}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder={`请选择 ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return (
        <Input
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? `请输入 ${field.label}`}
          className={inputClass}
        />
      );
  }
}
