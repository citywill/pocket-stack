import { BookOpenIcon } from '@heroicons/react/24/outline';

export const menu = [
  {
    title: '笔记本',
    icon: BookOpenIcon,
    path: '/notebook',
    userOnly: true,
  },
  {
    title: '笔记生成器管理',
    icon: BookOpenIcon,
    path: '/notebook/builder',
    adminOnly: true,
  },
];
