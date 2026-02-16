import { ViewColumnsIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export const menu = [
  {
    title: '个人看板',
    icon: ViewColumnsIcon,
    path: '/kanban',
    show: true,
  },
  {
    title: '任务日志',
    icon: ClipboardDocumentListIcon,
    path: '/kanban/logs',
    show: true,
  },
];
