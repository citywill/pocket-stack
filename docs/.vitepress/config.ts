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
          { text: '开发环境配置', link: '/开发环境配置' },
          { text: '示例演示', link: '/示例演示' },
          { text: '安装部署', link: '/安装部署' },
        ]
      },
      {
        text: '开发教程',
        items: [
          { text: '开发流程', link: '/教程1：开发流程' },
          { text: '前端开发', link: '/教程2：前端开发' },
          { text: '后端开发', link: '/教程3：后端开发' },
          { text: '前后端联调', link: '/教程4：前后端联调' },
          { text: '开发技巧', link: '/教程5：开发技巧' }
        ]
      },
      {
        text: '参考',
        items: [
          { text: '前端特性', link: '/前端特性' },
          { text: '菜单定义', link: '/菜单定义' },
          { text: '权限控制', link: '/权限控制' }
        ]
      }
    ]
  }
}