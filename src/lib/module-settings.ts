import type { ComponentType } from 'react';

/**
 * 模块设置框架
 *
 * 约定：任何模块在根目录提供 `settings.tsx` 并默认导出 `ModuleSettings`，
 * 系统设置页会自动将其注册为一个设置 Tab；所有字段 key 在存储时自动加
 * `{模块名}_` 前缀（模块名为 settings.tsx 所在目录名），避免模块间 key 冲突。
 */

/** 下拉选项 */
export interface SettingOption {
  label: string;
  value: string;
}

/** 字段公共属性 */
export interface SettingFieldBase {
  /** 短 key，存储时自动加模块名前缀，例如模块 menu 的 key="enable_custom_menu" 会存为 menu_enable_custom_menu */
  key: string;
  /** 字段名称 */
  label: string;
  /** 字段说明 */
  description?: string;
  /** 输入占位提示 */
  placeholder?: string;
}

export interface TextSettingField extends SettingFieldBase {
  type: 'text';
  defaultValue?: string;
}

export interface TextareaSettingField extends SettingFieldBase {
  type: 'textarea';
  defaultValue?: string;
}

export interface NumberSettingField extends SettingFieldBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface SwitchSettingField extends SettingFieldBase {
  type: 'switch';
  defaultValue?: boolean;
}

export interface SelectSettingField extends SettingFieldBase {
  type: 'select';
  options: SettingOption[];
  defaultValue?: string;
}

/** 模块设置字段 */
export type SettingField =
  | TextSettingField
  | TextareaSettingField
  | NumberSettingField
  | SwitchSettingField
  | SelectSettingField;

/** 模块设置描述（由模块 `settings.tsx` 默认导出） */
export interface ModuleSettings {
  /** Tab 标题 */
  title: string;
  /** Tab 说明 */
  description?: string;
  /** Tab 图标（@heroicons/react/24/outline） */
  icon: ComponentType<{ className?: string }>;
  /** 排序权重，默认 100，数值越小越靠前 */
  order?: number;
  /** 设置字段列表 */
  fields: SettingField[];
}

/** 注册后的完整设置 Tab（moduleName 由目录名自动推导） */
export interface ModuleSettingsTab extends ModuleSettings {
  /** 模块名，同时作为 key 前缀与 Tab value */
  moduleName: string;
  order: number;
}

/** 拼接模块设置的完整 key：{moduleName}_{shortKey} */
export function settingKey(moduleName: string, shortKey: string): string {
  return `${moduleName}_${shortKey}`;
}

/** 从 glob 相对路径解析模块名（…/modules/<moduleName>/settings.tsx） */
export function parseModuleName(globPath: string): string {
  const segments = globPath.split('/');
  return segments[segments.length - 2] ?? '';
}

/** 字段在无配置记录时的默认值 */
export function defaultFieldValue(field: SettingField): any {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  switch (field.type) {
    case 'switch':
      return false;
    case 'select':
      return field.options[0]?.value ?? '';
    case 'number':
      return undefined;
    default:
      return '';
  }
}

/** 收集所有模块根目录 settings.tsx 自动注册的设置 Tab（按 order、模块名稳定排序） */
export function collectModuleSettings(): ModuleSettingsTab[] {
  const modules = import.meta.glob('../modules/*/settings.tsx', { eager: true });

  return Object.entries(modules)
    .map(([path, mod]) => {
      const moduleName = parseModuleName(path);
      if (!moduleName) return null;
      const descriptor = (mod as { default?: ModuleSettings }).default;
      if (!descriptor || !descriptor.title || !descriptor.fields?.length) return null;
      return {
        ...descriptor,
        moduleName,
        order: descriptor.order ?? 100,
      };
    })
    .filter((tab): tab is ModuleSettingsTab => !!tab)
    .sort((a, b) => a.order - b.order || a.moduleName.localeCompare(b.moduleName));
}
