import { Bars3Icon } from '@heroicons/react/24/outline';
import type { ModuleSettings } from '@/lib/module-settings';

/**
 * 菜单模块设置，自动注册到系统设置页 Tab；
 * 字段 key 会自动加上模块名前缀，如 enable_custom_menu -> menu_enable_custom_menu。
 */
const menuSettings: ModuleSettings = {
  title: '菜单设置',
  description: '控制「菜单管理」中自定义菜单的显示行为。',
  icon: Bars3Icon,
  order: 10,
  fields: [
    {
      type: 'switch',
      key: 'enable_custom_menu',
      label: '启用自定义菜单',
      description: '开启后，将「菜单管理」中定义的菜单合并到默认模块菜单之后显示。',
      defaultValue: false,
    },
  ],
};

export default menuSettings;
