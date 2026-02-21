import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pb } from '@/lib/pocketbase';
import { ClientResponseError } from 'pocketbase';
import { useAuth } from '@/components/auth-provider';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, WalletIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function FinanceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());
        const startStr = startDate.toISOString().replace('T', ' ');
        const endStr = endDate.toISOString().replace('T', ' ');

        const filter = `user = "${user.id}" && date >= "${startStr}" && date <= "${endStr}"`;
        const records = await pb.collection('finance_records').getFullList({
          filter: filter,
          sort: 'date',
        });

        let income = 0;
        let expense = 0;

        // Generate daily data structure for the current month
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const dailyData = days.map(day => ({
          date: format(day, 'MM-dd'),
          fullDate: day,
          income: 0,
          expense: 0,
        }));

        records.forEach((r: any) => {
          // Update totals
          if (r.type === 'income') {
            income += r.amount;
          } else {
            expense += r.amount;
          }

          // Update daily chart data
          const recordDate = new Date(r.date);
          const dayEntry = dailyData.find(d => isSameDay(d.fullDate, recordDate));
          if (dayEntry) {
            if (r.type === 'income') {
              dayEntry.income += r.amount;
            } else {
              dayEntry.expense += r.amount;
            }
          }
        });

        setStats({
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
        });
        setChartData(dailyData);
      } catch (error) {
        if (error instanceof ClientResponseError && error.isAbort) {
          // Ignore auto-cancellation errors
          return;
        }
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: '本月总收入',
      value: `¥${stats.totalIncome.toFixed(2)}`,
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '本月总支出',
      value: `¥${stats.totalExpense.toFixed(2)}`,
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: '本月结余',
      value: `¥${stats.balance.toFixed(2)}`,
      icon: WalletIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">账单概览</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">查看您的财务状况统计。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {stat.title}
                  </p>
                  <h3 className={cn("mt-2 text-3xl font-bold", stat.color)}>
                    {loading ? '...' : stat.value}
                  </h3>
                </div>
                <div className={cn("p-3 rounded-2xl", stat.bgColor)}>
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>收支趋势 (本月)</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  stroke="#737373"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#737373"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `¥${value}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="收入"
                  stroke="#16a34a"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="支出"
                  stroke="#dc2626"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200 dark:border-neutral-800 shadow-none">
        <CardHeader>
          <CardTitle>最近动态</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 text-sm">
            本月统计数据已更新，您可以前往“记账记录”查看详细信息。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
