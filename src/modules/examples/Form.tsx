import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export function Form() {
  const [date, setDate] = React.useState<Date>();

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
        {/* 基本设置 */}
        <Card>
          <CardHeader>
            <CardTitle>基本设置</CardTitle>
            <CardDescription>配置网站的基本信息和管理员联系方式。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">网站名称</Label>
              <Input id="siteName" defaultValue="Admin 后台" placeholder="请输入网站名称" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">网站地址</Label>
              <Input
                id="siteUrl"
                type="url"
                defaultValue="https://example.com"
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">管理员邮箱</Label>
              <Input
                id="adminEmail"
                type="email"
                defaultValue="admin@example.com"
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">网站描述</Label>
              <Textarea
                id="description"
                placeholder="请输入网站的简短描述..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* 高级设置 */}
        <Card>
          <CardHeader>
            <CardTitle>高级设置</CardTitle>
            <CardDescription>配置系统的运行参数和功能开关。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 角色选择 */}
            <div className="space-y-2">
              <Label>默认用户角色</Label>
              <Select defaultValue="user">
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员 (Admin)</SelectItem>
                  <SelectItem value="editor">编辑 (Editor)</SelectItem>
                  <SelectItem value="user">普通用户 (User)</SelectItem>
                  <SelectItem value="guest">访客 (Guest)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 日期选择 */}
            <div className="space-y-2 flex flex-col">
              <Label>系统维护日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>选择日期</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 滑块 */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>缓存过期时间 (分钟)</Label>
                <span className="text-sm text-muted-foreground">30 min</span>
              </div>
              <Slider defaultValue={[30]} max={120} step={1} />
            </div>

            {/* 多选框 */}
            <div className="space-y-2">
               <Label>启用模块</Label>
               <div className="flex items-center space-x-2">
                  <Checkbox id="module-blog" />
                  <Label htmlFor="module-blog" className="font-normal">博客模块</Label>
               </div>
               <div className="flex items-center space-x-2">
                  <Checkbox id="module-shop" defaultChecked />
                  <Label htmlFor="module-shop" className="font-normal">商城模块</Label>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>通知设置</CardTitle>
            <CardDescription>管理系统通知的发送方式和频率。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
             <div className="space-y-4">
                <Label className="text-base">通知类型</Label>
                <RadioGroup defaultValue="all">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="r1" />
                    <Label htmlFor="r1" className="font-normal">接收所有通知</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="important" id="r2" />
                    <Label htmlFor="r2" className="font-normal">仅接收重要通知</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="r3" />
                    <Label htmlFor="r3" className="font-normal">不接收任何通知</Label>
                  </div>
                </RadioGroup>
             </div>

             <div className="space-y-4">
                <Label className="text-base">推送渠道</Label>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-base">邮件通知</Label>
                    <p className="text-sm text-muted-foreground">
                      发送系统更新到注册邮箱
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-base">短信通知</Label>
                    <p className="text-sm text-muted-foreground">
                      发送验证码和紧急告警
                    </p>
                  </div>
                  <Switch />
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline">重置</Button>
        <Button className="bg-blue-600 hover:bg-blue-700">保存所有设置</Button>
      </div>
    </div>
  );
}
