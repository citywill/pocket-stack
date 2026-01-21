import {
  ChartLineData01Icon,
  Settings01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

/**
 * Admin 模块菜单配置
 * 包含仪表盘、用户管理和系统管理（全局配置、系统初始化）
 */
export const adminMenu = [
  {
    title: '仪表盘',
    path: '/admin/dashboard',
    icon: ChartLineData01Icon,
    adminOnly: true,
  },
  {
    title: '用户管理',
    path: '/admin/users',
    icon: UserGroupIcon,
    adminOnly: true,
  },
  {
    title: '系统管理',
    icon: Settings01Icon,
    adminOnly: true,
    children: [
      { title: '全局配置', path: '/admin/settings' },
      { title: '系统初始化', path: '/admin/install' },
    ],
  },
];
