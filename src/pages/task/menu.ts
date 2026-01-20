import {
  Task01Icon,
  DashboardCircleIcon,
  Calendar03Icon,
} from '@hugeicons/core-free-icons';

/**
 * 任务模块菜单配置
 * 注册到 src/components/layout/Sidebar.tsx
 */
export const taskMenu = [
  {
    title: '任务概览',
    path: '/',
    icon: DashboardCircleIcon,
    userOnly: true,
  },
  {
    title: '任务管理',
    path: '/task/tasks',
    icon: Task01Icon,
    userOnly: true,
  },
  {
    title: '任务日历',
    path: '/task/calendar',
    icon: Calendar03Icon,
    userOnly: true,
  },
];
