import { ViewColumnsIcon, CalendarIcon } from '@heroicons/react/24/outline';

export const menu = [
  {
    title: '个人看板',
    icon: ViewColumnsIcon,
    path: '/kanban',
    show: true,
  },
  {
    title: '任务日历',
    icon: CalendarIcon,
    path: '/kanban/calendar',
    show: true,
  },
];
