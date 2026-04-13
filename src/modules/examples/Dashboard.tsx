import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChartBarIcon,
  ShoppingCartIcon,
  UsersIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

const REVENUE_DATA = [
  { name: 'Jan', value: 4500 },
  { name: 'Feb', value: 5200 },
  { name: 'Mar', value: 4800 },
  { name: 'Apr', value: 6100 },
  { name: 'May', value: 5900 },
  { name: 'Jun', value: 7200 },
  { name: 'Jul', value: 8500 },
  { name: 'Aug', value: 7800 },
  { name: 'Sep', value: 9200 },
  { name: 'Oct', value: 8800 },
  { name: 'Nov', value: 11000 },
  { name: 'Dec', value: 12500 },
];

const SALES_BY_CATEGORY = [
  { name: '电子产品', value: 400 },
  { name: '服装鞋帽', value: 300 },
  { name: '食品饮料', value: 300 },
  { name: '日用百货', value: 200 },
];

const RECENT_ORDERS = [
  { id: 'ORD-1234', customer: '张三', amount: '¥1,234.00', status: 'completed', date: '2024-12-22' },
  { id: 'ORD-1235', customer: '李四', amount: '¥850.50', status: 'pending', date: '2024-12-22' },
  { id: 'ORD-1236', customer: '王五', amount: '¥2,100.00', status: 'processing', date: '2024-12-21' },
  { id: 'ORD-1237', customer: '赵六', amount: '¥450.00', status: 'completed', date: '2024-12-21' },
  { id: 'ORD-1238', customer: '钱七', amount: '¥3,200.00', status: 'cancelled', date: '2024-12-20' },
];

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  description
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{value}</div>
        <div className="mt-1 flex items-center gap-1">
          <span className={cn(
            "flex items-center text-xs font-medium",
            trend === 'up' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend === 'up' ? (
              <ArrowUpIcon className="mr-0.5 h-3 w-3" />
            ) : (
              <ArrowDownIcon className="mr-0.5 h-3 w-3" />
            )}
            {change}
          </span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getComputedColorVar(variable: string): string {
  if (typeof window === 'undefined') return '#3b82f6';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#3b82f6';
}

function getComputedChartColors() {
  return {
    primary: getComputedColorVar('--primary'),
    chart1: getComputedColorVar('--chart-1'),
    chart2: getComputedColorVar('--chart-2'),
    chart3: getComputedColorVar('--chart-3'),
    chart4: getComputedColorVar('--chart-4'),
    border: getComputedColorVar('--border'),
    mutedForeground: getComputedColorVar('--muted-foreground'),
    card: getComputedColorVar('--card'),
    cardForeground: getComputedColorVar('--card-foreground'),
  };
}

export function ExampleDashboard() {
  const { colorTheme } = useTheme();
  const [chartColors, setChartColors] = useState(getComputedChartColors);

  const updateChartColors = useCallback(() => {
    requestAnimationFrame(() => {
      setChartColors(getComputedChartColors());
    });
  }, []);

  useEffect(() => {
    updateChartColors();
  }, [colorTheme, updateChartColors]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">
            电商概览
          </h1>
          <p className="mt-1 text-muted-foreground">
            欢迎回来，这是您今天的店铺运营数据。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden md:flex">
            <CalendarIcon className="mr-2 h-4 w-4" />
            2024年12月
          </Button>
          <Button>
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="总销售额"
          value="¥128,430.00"
          change="+12.5%"
          trend="up"
          icon={BanknotesIcon}
          description="较上月"
        />
        <MetricCard
          title="订单数"
          value="1,240"
          change="+8.2%"
          trend="up"
          icon={ShoppingCartIcon}
          description="较上月"
        />
        <MetricCard
          title="新增客户"
          value="324"
          change="-2.4%"
          trend="down"
          icon={UsersIcon}
          description="较上月"
        />
        <MetricCard
          title="活跃用户"
          value="12,430"
          change="+15.3%"
          trend="up"
          icon={ChartBarIcon}
          description="较上月"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>销售趋势</CardTitle>
            <CardDescription>展示过去一年的月度销售额增长情况。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.1} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.border} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: chartColors.mutedForeground }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: chartColors.mutedForeground }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: chartColors.card,
                      color: chartColors.cardForeground
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>分类占比</CardTitle>
            <CardDescription>各商品分类的销售额占比。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SALES_BY_CATEGORY}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill={chartColors.chart1} />
                    <Cell fill={chartColors.chart2} />
                    <Cell fill={chartColors.chart3} />
                    <Cell fill={chartColors.chart4} />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: chartColors.card,
                      color: chartColors.cardForeground
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {SALES_BY_CATEGORY.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: chartColors[`chart${index + 1}` as keyof typeof chartColors] }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="ml-auto text-sm font-medium text-card-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>最近订单</CardTitle>
              <CardDescription>您店铺最近发生的5笔交易。</CardDescription>
            </div>
            <Button variant="ghost" size="sm">查看全部</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_ORDERS.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <ShoppingCartIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.id} • {order.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-card-foreground">{order.amount}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-1 text-[10px]",
                        order.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        order.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                        order.status === 'processing' && "bg-primary/10 text-primary",
                        order.status === 'cancelled' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {order.status === 'completed' ? '已完成' :
                        order.status === 'pending' ? '待支付' :
                          order.status === 'processing' ? '处理中' : '已取消'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>热销商品</CardTitle>
            <CardDescription>本月销量前五的商品。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: '智能手机 iPhone 15 Pro', sales: 124, growth: '+12%', image: '📱' },
                { name: '无线蓝牙耳机 AirPods Max', sales: 85, growth: '+5%', image: '🎧' },
                { name: '机械键盘 Custom RGB', sales: 64, growth: '+18%', image: '⌨️' },
                { name: '超宽显示器 34" Curved', sales: 42, growth: '+2%', image: '🖥️' },
                { name: '人体工学椅 Pro Office', sales: 38, growth: '+9%', image: '🪑' },
              ].map((product, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                    {product.image}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">{product.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{product.sales} 销量</span>
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{product.growth}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}