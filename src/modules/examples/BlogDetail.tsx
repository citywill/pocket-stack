import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeftIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  ChevronRightIcon,
  BookmarkIcon,
  Bars3Icon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function BlogDetail() {
  const [activeId, setActiveId] = useState<string>('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );

    const headings = document.querySelectorAll('h2, h3');
    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsSheetOpen(false);
    }
  };

  const tocItems = [
    { id: 'why-react-19', title: '为什么选择 React 19？', level: 2 },
    { id: 'pocketbase-advantages', title: 'PocketBase 的轻量级优势', level: 2 },
    { id: 'core-features', title: '核心特性', level: 3 },
    { id: 'performance-optimization', title: '性能优化最佳实践', level: 2 },
    { id: 'realworld-cases', title: '实战案例分析', level: 2 },
    { id: 'deployment-scaling', title: '部署与横向扩展', level: 3 },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 py-12">
      <div className="relative flex gap-12 max-w-7xl mx-auto px-4 lg:px-8">
        {/* 移动端悬浮目录按钮 */}
        <div className="xl:hidden fixed bottom-6 right-6 z-50">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="icon" className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-none">
                <PaperAirplaneIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] border-neutral-200 dark:border-neutral-800">
              <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <SheetTitle className="flex items-center gap-2">
                  <Bars3Icon className="h-5 w-5 text-blue-600" />
                  目录导航
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 relative">
                <div className="absolute left-0 top-0 w-px h-full bg-neutral-100 dark:bg-neutral-800" />
                <ul className="space-y-2 relative">
                  {tocItems.map((item) => (
                    <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 1.5}rem` }}>
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          "w-full text-left py-3 px-4 text-sm transition-all duration-300 border-l-2 -ml-[1px] rounded-r-xl",
                          activeId === item.id
                            ? "text-blue-600 border-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-900/10"
                            : "text-neutral-500 border-transparent hover:text-neutral-900 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                        )}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1 max-w-4xl space-y-8 pb-12">
          {/* 顶部导航 */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="rounded-xl -ml-2 text-neutral-600 hover:text-blue-600 transition-colors">
              <Link to="/examples/portal/landing">
                <ChevronLeftIcon className="mr-2 h-4 w-4" />
                返回首页
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
                <BookmarkIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
                <ShareIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 封面图片 */}
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop"
              alt="Blog Cover"
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-blue-600/90 backdrop-blur-md text-white border-none px-3 py-1 rounded-lg">
                技术分享
              </Badge>
            </div>
          </div>

          {/* 标题与元数据 */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight">
              使用 React 19 和 PocketBase 构建高性能全栈应用
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-neutral-900 dark:text-neutral-200">CityWill</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>2024年12月25日</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeIcon className="h-4 w-4" />
                <span>1,234 次阅读</span>
              </div>
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>12 条评论</span>
              </div>
            </div>
          </div>

          <Separator className="bg-neutral-100 dark:bg-neutral-800" />

          {/* 文章内容 */}
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
              随着 React 19 的发布，前端开发进入了一个全新的阶段。结合 PocketBase 这样的轻量级后端，我们可以快速构建出功能完备且性能卓越的应用。本文将深入探讨这种组合的技术优势。
            </p>

            <h2 id="why-react-19" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">为什么选择 React 19？</h2>
            <p className="mb-6">
              React 19 带来了许多令人兴奋的特性，如 Actions、Server Components 的改进以及更好的并发渲染支持。这些特性旨在简化数据流管理，减少客户端的 JavaScript 体积，并提供更流畅的用户体验。
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-6 rounded-r-2xl my-8">
              <p className="text-blue-700 dark:text-blue-400 italic font-medium m-0">
                "React 19 不仅仅是一个版本更新，它是对现代 Web 开发范式的重新思考。"
              </p>
            </div>

            <h2 id="pocketbase-advantages" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">PocketBase 的轻量级优势</h2>
            <p className="mb-6">
              PocketBase 作为一个单文件的 Go 后端，集成了 SQLite 数据库、身份验证、文件存储和实时订阅功能。它极大地降低了全栈开发的门槛，特别适合中小型项目或快速原型开发。
            </p>

            <h3 id="core-features" className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mt-6 mb-3">核心特性：</h3>
            <ul className="list-disc pl-6 space-y-2 mb-8">
              <li>实时数据库同步</li>
              <li>内置用户管理和 OAuth2</li>
              <li>自动生成的 RESTful API</li>
              <li>简单的部署流程</li>
            </ul>

            <h2 id="performance-optimization" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">性能优化最佳实践</h2>
            <p className="mb-6">
              在构建高性能全栈应用时，前端与后端的协同优化至关重要。利用 React 19 的新特性，我们可以显著提升应用的响应速度和加载体验。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <h4 className="font-bold text-blue-600 mb-2">资源预加载</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">使用 React 19 的预加载 API，可以在组件渲染前就开始获取关键资源，减少首屏白屏时间。</p>
              </div>
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <h4 className="font-bold text-blue-600 mb-2">乐观更新</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">通过 useOptimistic 钩子，我们可以在后端响应之前就更新 UI，让应用操作感觉像本地应用一样流畅。</p>
              </div>
            </div>

            <h2 id="realworld-cases" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">实战案例分析</h2>
            <p className="mb-6">
              让我们看一个具体的例子：在一个协作任务管理系统中，我们如何利用 PocketBase 的实时订阅功能（Realtime SDK）和 React 的并发模式来实现毫秒级的同步体验。
            </p>
            <p className="mb-6">
              当一个用户更新任务状态时，PocketBase 会通过 SSE（Server-Sent Events）推送变更。前端接收到事件后，利用 React 19 的 Transitions 功能平滑地更新视图，避免了昂贵的全局重新渲染。
            </p>

            <h3 id="deployment-scaling" className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mt-6 mb-3">部署与横向扩展</h3>
            <p className="mb-6">
              虽然 PocketBase 是单文件设计，但通过合理的架构设计，它依然可以支持高并发场景。配合 Docker 容器化部署和 CDN 加速，我们可以轻松应对数万级的活跃用户。
            </p>
            <div className="bg-neutral-900 text-neutral-100 p-6 rounded-2xl font-mono text-sm my-8">
              <p className="text-blue-400"># 使用 Docker 一键部署 PocketBase</p>
              <p>docker run -d --name pocketbase \</p>
              <p className="pl-4">-p 8090:8090 \</p>
              <p className="pl-4">-v pb_data:/pb/pb_data \</p>
              <p className="pl-4">pocketbase/pocketbase:latest</p>
            </div>
          </article>

          <Separator className="bg-neutral-100 dark:bg-neutral-800" />

          {/* 上下篇导航 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="group hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
              <CardContent>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
                    <ChevronLeftIcon className="h-3 w-3" />
                    上一篇
                  </span>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                    深入理解 Tailwind CSS v4 的新特性
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-right">
              <CardContent>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-blue-500 transition-colors flex items-center gap-1 justify-end">
                    下一篇
                    <ChevronRightIcon className="h-3 w-3" />
                  </span>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                    Vibe Coding: 开启 AI 驱动的编程新时代
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 右侧浮动导航 - 仅在桌面端显示 */}
        <div className="hidden xl:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold">
                <Bars3Icon className="h-4 w-4 text-blue-600" />
                <span>目录导航</span>
              </div>
              <nav className="relative">
                {/* 活动指示条 */}
                <div className="absolute left-0 top-0 w-px h-full bg-neutral-100 dark:bg-neutral-800" />

                <ul className="space-y-1 relative">
                  {tocItems.map((item) => (
                    <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          "w-full text-left py-2 px-4 text-sm transition-all duration-300 border-l-2 -ml-[1px]",
                          activeId === item.id
                            ? "text-blue-600 border-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-900/10"
                            : "text-neutral-500 border-transparent hover:text-neutral-900 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
                        )}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <Card className="rounded-2xl bg-blue-600 text-white border-none shadow-blue-200 dark:shadow-none">
              <CardContent className="p-6">
                <h4 className="font-bold mb-2">想要获取源码？</h4>
                <p className="text-sm text-blue-100 mb-4">关注我们的 GitHub 项目，获取最新的 Pocket Stack 示例。</p>
                <Button variant="secondary" className="w-full rounded-xl bg-white text-blue-600 hover:bg-blue-50">
                  前往项目
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
