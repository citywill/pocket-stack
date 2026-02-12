import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export function Loading() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<string | null>(null);

  // 模拟从后端接口获取数据
  const fetchData = async () => {
    setIsLoading(true);
    // 模拟 2 秒延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setData('这是从后端接口成功获取的数据内容。');
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col">
      {/* 页面头部始终显示 */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            整体加载示例
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            展示页面整体数据获取时的 Loading 效果
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={isLoading}
          variant="outline"
          className="rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <ArrowPathIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          重新请求数据
        </Button>
      </div>

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center space-y-4">
            {/* 简化的旋转加载图标 */}
            <div className="h-10 w-10 rounded-full border-4 border-neutral-100 border-t-blue-600 animate-spin"></div>
            <p className="text-neutral-500 animate-pulse">正在加载数据...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden gap-0 !p-0">
              <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-neutral-100 !p-4">
                <CardTitle className="text-lg font-semibold text-blue-600">数据获取成功</CardTitle>
              </CardHeader>
              <CardContent className="p-12 text-center bg-blue-50/20">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-2">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 leading-relaxed">
                    {data}
                  </p>
                  <p className="text-neutral-500">
                    页面整体内容已从远程服务器加载完毕，现在可以进行后续操作。
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow !p-0">
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        统计项 {i}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        该模块的数据已随整体请求一同返回并完成渲染。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
