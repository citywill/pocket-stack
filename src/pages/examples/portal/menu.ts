import { Tv01Icon } from '@hugeicons/core-free-icons';

export const portalMenu = {
  title: '前台示例',
  icon: Tv01Icon,
  children: [
    { title: '落地页（游客访问）', path: '/portal/landing', external: true },
    { title: '博客详情（需登录）', path: '/portal/blog-detail', external: true },
  ],
};
