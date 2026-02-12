import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Blank() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          页面标题
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          页面描述
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>卡片标题</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800">
            <p className="text-neutral-500 dark:text-neutral-400">
              卡片内容
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
