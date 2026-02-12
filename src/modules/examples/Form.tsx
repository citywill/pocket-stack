import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Form() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          系统设置
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          管理系统配置和偏好设置
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">网站名称</Label>
              <Input id="siteName" defaultValue="Admin 后台" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">网站地址</Label>
              <Input
                id="siteUrl"
                type="url"
                defaultValue="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">管理员邮箱</Label>
              <Input
                id="adminEmail"
                type="email"
                defaultValue="admin@example.com"
              />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              保存设置
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>通知设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  邮件通知
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  接收系统邮件通知
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-neutral-300"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  推送通知
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  接收浏览器推送通知
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  短信通知
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  接收短信通知
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
