import { BeakerIcon } from '@heroicons/react/24/outline';
import type { ModuleSettings } from '@/lib/module-settings';

/**
 * 示例模块设置，演示模块自定义设置的用法（各类型字段），
 * 字段 key 自动加 examples_ 前缀，便于其他模块参考复制。
 */
const examplesSettings: ModuleSettings = {
  title: '示例模块',
  description: '演示各类型设置字段的写法；其中「欢迎横幅」已接入仪表盘展示，字段 key 会自动加模块名前缀。',
  icon: BeakerIcon,
  order: 100,
  fields: [
    {
      type: 'switch',
      key: 'greeting_banner',
      label: '显示欢迎横幅',
      description: '控制仪表盘是否显示欢迎横幅（演示 switch 字段与页面联动）',
      defaultValue: false,
    },
    {
      type: 'select',
      key: 'default_page_size',
      label: '默认分页大小',
      description: '演示 select 下拉字段',
      defaultValue: '10',
      options: [
        { label: '每页 10 条', value: '10' },
        { label: '每页 20 条', value: '20' },
        { label: '每页 50 条', value: '50' },
      ],
    },
    {
      type: 'text',
      key: 'welcome_message',
      label: '欢迎文案',
      description: '欢迎横幅展示的文案，留空显示默认文案（演示 text 字段与页面联动）',
      placeholder: '请输入欢迎文案',
    },
    {
      type: 'textarea',
      key: 'dashboard_note',
      label: '仪表盘备注',
      description: '演示 textarea 多行文本字段',
      placeholder: '请输入仪表盘备注',
    },
    {
      type: 'number',
      key: 'max_items',
      label: '展示条数上限',
      description: '演示 number 数字字段',
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 10,
    },
  ],
};

export default examplesSettings;
