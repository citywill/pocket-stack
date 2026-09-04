import { GlobeAltIcon } from '@heroicons/react/24/outline';
import type { ModuleSettingsTab } from '@/lib/module-settings';

/**
 * 系统级全局配置 Tab（非某个业务模块），key 前缀使用 system，
 * 例如 system_site_name、system_footer_text。
 */
export const SYSTEM_GLOBAL_SETTINGS: ModuleSettingsTab = {
  moduleName: 'system',
  title: '全局配置',
  description: '系统站点信息等全局基本配置，设置项 key 自动带 system_ 前缀。',
  icon: GlobeAltIcon,
  order: 0,
  fields: [
    {
      type: 'text',
      key: 'site_name',
      label: '系统名称',
      description: '显示在页面顶部的系统名称',
      placeholder: '请输入系统名称',
    },
    {
      type: 'text',
      key: 'contact_email',
      label: '管理员邮箱',
      description: '系统管理员的联系邮箱',
      placeholder: 'admin@example.com',
    },
    {
      type: 'textarea',
      key: 'footer_text',
      label: '页脚文字',
      description: '显示在页面底部的版权信息',
      placeholder: '© 2026 Pocket Stack. All rights reserved.',
    },
  ],
};
