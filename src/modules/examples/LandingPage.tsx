import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChatBubbleBottomCenterTextIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowRightIcon,
  Squares2X2Icon,
  CpuChipIcon,
  Bars3Icon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

export function LandingPage() {
  const features = [
    {
      title: 'PocketBase 集成',
      description: '内置 PocketBase 后端支持，实现极速身份验证和实时数据同步。',
      icon: CloudArrowUpIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'AI 智能驱动',
      description: '集成多种 LLM 模型，提供 AI 对话和智能数据分析助手。',
      icon: ChatBubbleBottomCenterTextIcon,
      color: 'bg-purple-500'
    },
    {
      title: '模块化架构',
      description: '遵循严格的模块化开发规范，路由与菜单自动注册，易于扩展。',
      icon: Squares2X2Icon,
      color: 'bg-green-500'
    },
    {
      title: '企业级安全',
      description: '完善的角色权限控制系统，支持管理员与普通用户权限隔离处理。',
      icon: ShieldCheckIcon,
      color: 'bg-red-500'
    },
    {
      title: '极致性能',
      description: '基于 Vite + React 19，响应迅速，体验流畅。',
      icon: BoltIcon,
      color: 'bg-yellow-500'
    },
    {
      title: 'shadcn/ui 设计',
      description: '采用现代化 UI 组件库，配合 rounded-2xl 圆角风格，极致美观。',
      icon: CpuChipIcon,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 selection:bg-blue-100 selection:text-blue-600">
      {/* 顶部导航 */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors">特性</a>
              <a href="#tech-stack" className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors">技术栈</a>
              <Link to="/examples/portal/blog-detail" target="_blank" className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors">博客示例</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:flex rounded-xl">
              <Link to="/login">登录</Link>
            </Button>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" asChild>
              <Link to="/register">立即开启</Link>
            </Button>
            <Button variant="outline" size="icon" className="md:hidden rounded-xl">
              <Bars3Icon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge className="mb-6 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 font-medium">
              Pocket Stack v1.0 现已发布
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 mb-8 leading-[1.1]">
              构建全栈应用的<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">更高效方式</span>
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10">
              集成 PocketBase、React 19 和 AI 助手的现代化全栈开发框架。提供从原型设计到生产部署的一站式解决方案。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-xl shadow-blue-500/25 group" asChild>
                <Link to="/register">
                  开始使用
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-bold border-neutral-200 dark:border-neutral-800" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <CodeBracketIcon className="mr-2 h-5 w-5" />
                  GitHub 源码
                </a>
              </Button>
            </div>

            {/* Preview Image */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2.5rem] blur opacity-20" />
              <div className="relative rounded-[2rem] overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                  alt="Dashboard Preview"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-neutral-50 mb-4">
                为现代化团队打造的核心特性
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                我们整合了最优秀的工具和实践，让您可以专注于业务逻辑而非底层架构。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group border-none shadow-none bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", feature.color)}>
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-3 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-blue-600 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-500/20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#ffffff10,transparent)]" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
                  准备好开启您的下一个项目了吗？
                </h2>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                  现在加入 Pocket Stack 社区，体验前所未有的全栈开发速度。
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="h-14 px-10 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 text-lg font-bold shadow-xl">
                    立即免费注册
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl text-lg font-bold border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                    查看文档
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <Logo />
          <div className="flex gap-8 text-sm text-neutral-500 dark:text-neutral-400">
            <a href="#" className="hover:text-blue-600 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-blue-600 transition-colors">服务条款</a>
            <a href="#" className="hover:text-blue-600 transition-colors">更新日志</a>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            © 2024 Pocket Stack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
