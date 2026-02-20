import {
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

/**
 * Admin 模块菜单配置
 * 包含仪表盘、用户管理和系统管理（全局配置、系统初始化）
 */
export const adminMenu = [
  {
    title: '仪表盘',
    path: '/admin/dashboard',
    icon: ChartBarIcon,
    adminOnly: true,
  },
  {
    title: '用户管理',
    path: '/admin/users',
    icon: UsersIcon,
    adminOnly: true,
  },
  {
    title: '系统管理',
    icon: Cog6ToothIcon,
    adminOnly: true,
    children: [
      { title: '全局配置', path: '/admin/settings' },
      { title: '系统初始化', path: '/admin/install' },
    ],
  },
];
