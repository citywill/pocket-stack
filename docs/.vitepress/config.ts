import { escape } from "querystring";

export default {
  // 站点级选项
  base: '/pocket-stack/',
  title: 'Pocket Stack',
  description: 'AI友好的全栈开发解决方案',
  head: [['link', { rel: 'icon', href: '/pocket-stack/pocket-stack.svg', }]],
  themeConfig: {
    // 主题级选项
    logo: '/pocket-stack.svg',
    siteTitle: 'Pocket Stack',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/citywill/pocket-stack' }
    ],
    search: {
      provider: 'local'
    },
    outline: {
      level: [2, 4],
      label: '目录'
    },
    sidebar: [
      {
        text: '概要',
        collapsed: false,
        items: [
          { text: '项目说明', link: '/index' },
          { text: '快速开始', link: '/快速开始' },
          { text: '安装部署', link: '/安装部署' },
          { text: '后台管理', link: '/后台管理功能' },
          { text: '示例模块', link: '/示例模块' },
        ]
      },
      {
        text: '开发教程',
        collapsed: false,
        items: [
          { text: '开发环境配置', link: '/教程：开发环境配置' },
          { text: '模块开发教程', link: '/教程：模块开发教程' },
        ]
      },
      {
        text: '专题',
        collapsed: false,
        items: [
          { text: '前端特性', link: '/前端特性' },
          { text: '菜单定义', link: '/菜单定义' },
          { text: '权限控制', link: '/权限控制' },
          { text: '后端技巧', link: '/后端技巧' },
        ]
      },
      {
        text: '模块',
        collapsed: false,
        items: [
          { text: '模块说明', link: '/modules/index' },
          {
            text: '系统模块', 
            collapsed: true,
            items: 
            [
              { text: '系统设置', link: '/modules/settings' },
              { text: '用户管理', link: '/modules/user' },
              { text: '菜单管理', link: '/modules/menu' },
            ] 
          },
          {
            text: '应用模块', 
            collapsed: true,
            items: 
            [
              { text: '口袋笔记', link: '/modules/notes' },
              { text: '口袋 AI 助理', link: '/modules/ai' },
              { text: '口袋 NotebookLM', link: '/modules/notebooklm' },
              { text: '口袋看板', link: '/modules/kanban' },
              { text: '口袋记账', link: '/modules/finance' },
              { text: '口袋OKRs', link: '/modules/okr' },
            ] 
          },
        ]
      },
    ]
  }
}