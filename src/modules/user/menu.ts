import { UsersIcon } from '@heroicons/react/24/outline';

export const menu = {
  title: '用户管理',
  icon: UsersIcon,
  path: '/user',
  adminOnly: true,
  show: true,
  children: [
    { title: '数据概览', path: '/user', show: true },
    { title: '用户列表', path: '/user/list', show: true },
  ],
};