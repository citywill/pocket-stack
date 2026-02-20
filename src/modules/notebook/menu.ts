import { BookOpenIcon } from '@heroicons/react/24/outline';

export const menu = {
  title: '笔记本',
  icon: BookOpenIcon,
  children: [
    { title: '笔记列表', path: '/notebook' },
    { title: '生成器管理', path: '/notebook/builder' },
  ],
};
