import { PrismIcon } from '@hugeicons/core-free-icons';

export const exampleMenu = {
  title: '示例页面',
  icon: PrismIcon,
  children: [
    { title: '仪表盘', path: '/examples/dashboard' },
    { title: '空页面', path: '/examples/blank' },
    { title: '表格', path: '/examples/table' },
    { title: '卡片', path: '/examples/card' },
    { title: '表单', path: '/examples/form' },
    { title: '落地页（游客访问）', path: '/examples/portal/landing', external: true },
    { title: '博客详情（需登录）', path: '/examples/portal/blog-detail', external: true },
  ],
};
