import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { startOfMonth, endOfMonth } from 'date-fns';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, WalletIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function FinanceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const start = startOfMonth(new Date()).toISOString().replace('T', ' ');
        const end = endOfMonth(new Date()).toISOString().replace('T', ' ');

        const filter = `user = "${user.id}" && date >= "${start}" && date <= "${end}"`;
        const records = await pb.collection('finance_records').getFullList({
          filter: filter,
        });

        let income = 0;
        let expense = 0;

        records.forEach((r: any) => {
          if (r.type === 'income') {
            income += r.amount;
          } else {
            expense += r.amount;
          }
        });

        setStats({
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
        });
      } catch (error) {
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
