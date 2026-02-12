import { CubeIcon } from '@heroicons/react/24/outline';

export const menu = {
  title: '示例页面',
  icon: CubeIcon,
  children: [
    { title: '仪表盘', path: '/examples/dashboard' },
    { title: '空页面', path: '/examples/blank' },
    { title: '表格', path: '/examples/table' },
    { title: '卡片', path: '/examples/card' },
    { title: '表单', path: '/examples/form' },
    { title: '加载中', path: '/examples/loading' },
    { title: 'CURD 示例', path: '/examples/curd' },
    { title: 'Iframe 示例', path: '/examples/iframe' },
    { title: '跳出到外部', path: 'https://citywill.github.io/pocket-stack', external: true },
    { title: '隐藏菜单', path: 'https://citywill.github.io/pocket-stack/login', show: false },
    { title: '落地页（游客访问）', path: '/examples/portal/landing', external: true },
    { title: '博客详情（需登录）', path: '/examples/portal/blog-detail', external: true },
  ],
};
