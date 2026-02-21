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
    sidebar: [
      {
        text: '概要',
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
        items: [
          { text: '开发环境配置', link: '/教程：开发环境配置' },
          { text: '开发流程', link: '/教程：开发流程' },
          { text: '前端开发', link: '/教程：前端开发' },
          { text: '后端开发', link: '/教程：后端开发' },
          { text: '前后端联调', link: '/教程：前后端联调' },
          { text: '开发技巧', link: '/教程：开发技巧' }
        ]
      },
      {
        text: '专题',
        items: [
          { text: '前端特性', link: '/前端特性' },
          { text: '菜单定义', link: '/菜单定义' },
          { text: '权限控制', link: '/权限控制' }
        ]
      },
      {
        text: 'Demo模块',
        items: [
          { text: '演示模块说明', link: '/demos/index' },
          { text: '口袋笔记', link: '/demos/notes' },
          { text: '口袋看板', link: '/demos/kanban' },
          { text: '口袋记账', link: '/demos/finance' },
          { text: '口袋OKRs', link: '/demos/okr' },
        ]
      },
    ]
  }
}