import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="relative mb-8">
        <h1 className="text-[120px] font-black leading-none text-neutral-200 dark:text-neutral-800 select-none">
          404
        </h1>
        <div className="flex items-center justify-center">
          <div className="dark:bg-neutral-950 px-4 py-2">
            <p className="text-xl font-semibold text-neutral-600 dark:text-neutral-100">
              页面未找到
            </p>
          </div>
        </div>
      </div>

      <p className="max-w-[460px] text-neutral-600 dark:text-neutral-400 mb-8">
        抱歉，我们找不到您要访问的页面。它可能已被移动、删除，或者地址输入有误。
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          返回上一页
        </Button>
        <Button asChild>
          <Link to="/">
            <HomeIcon className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>
    </div>
  );
}
