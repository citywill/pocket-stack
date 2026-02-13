import { ChartBarIcon } from '@heroicons/react/24/outline';

export const menu = {
  id: 'okr',
  title: '我的 OKRs',
  icon: ChartBarIcon,
  path: '/okr/list',
  activePath: '^/okr/', // 匹配所有以 /okr/ 开头的路径
  userOnly: true,
};
