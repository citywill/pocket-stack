import { FolderIcon } from '@heroicons/react/24/outline';

export const menu = {
  title: '树状笔记',
  icon: FolderIcon,
  children: [
    { title: '笔记列表', path: '/treenote/note' },
    { title: '分类管理', path: '/treenote/category' },
  ],
};