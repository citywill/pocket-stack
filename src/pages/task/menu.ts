import { Task01Icon } from '@hugeicons/core-free-icons';

/**
 * 任务模块菜单配置
 * 注册到 src/components/layout/Sidebar.tsx
 */
export const taskMenu = {
  title: '任务模块',
  icon: Task01Icon,
  userOnly: true,
  children: [
    { title: '任务概览', path: '/task/dashboard' },
    { title: '任务管理', path: '/task/tasks' },
    { title: '任务日历', path: '/task/calendar' },
  ],
};
