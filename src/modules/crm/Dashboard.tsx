import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CurrencyYenIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  UsersIcon,
  ArrowPathIcon,
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

// --- Components ---

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  description,
  loading = false
}: {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  description: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        ) : (
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{value}</div>
        )}
        <div className="mt-1 flex items-center gap-1">
          <span className={cn(
            "flex items-center text-xs font-medium",
            trend === 'up' ? "text-green-600" : "text-red-600"
          )}>
            {trend === 'up' ? (
              <ArrowUpIcon className="mr-0.5 h-3 w-3" />
            ) : (
              <ArrowDownIcon className="mr-0.5 h-3 w-3" />
            )}
            {change}
          </span>
          <span className="text-xs text-neutral-500">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CrmDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCompanies: 0,
    activeOpportunities: 0,
    totalContractAmount: 0,
    avgCycleDays: 0,
  });
  const [opportunityTrend, setOpportunityTrend] = useState<any[]>([]);
  const [contractStatusData, setContractStatusData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Metrics
      const [companiesRes, opportunitiesRes, contractsRes] = await Promise.all([
        pb.collection('crm_companies').getList(1, 1, { requestKey: null }),
        pb.collection('crm_opportunities').getList(1, 1, {
          filter: 'status != "赢单关闭" && status != "输单关闭"',
          requestKey: null,
        }),
        pb.collection('crm_contracts').getFullList({
          filter: 'status = "执行中" || status = "已完成"',
          requestKey: null,
        }),
      ]);

      const totalAmount = contractsRes.reduce((sum, item) => sum + (item.amount || 0), 0);

      setMetrics({
        totalCompanies: companiesRes.totalItems,
        activeOpportunities: opportunitiesRes.totalItems,
        totalContractAmount: totalAmount,
        avgCycleDays: 24, // 这里可以根据实际逻辑计算，暂时固定
      });

      // 2. Fetch Chart Data (Opportunity Trend)
      // 简单起见，获取过去12个月的商机并按月分组
      const allOpps = await pb.collection('crm_opportunities').getFullList({
        sort: 'created',
        requestKey: null,
      });
      const monthlyData: Record<string, number> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(m => monthlyData[m] = 0);

      allOpps.forEach(opp => {
        const date = new Date(opp.created);
        const monthName = months[date.getMonth()];
        monthlyData[monthName]++;
      });

      setOpportunityTrend(months.map(name => ({ name, value: monthlyData[name] })));

      // 3. Fetch Contract Status Data
      const allContracts = await pb.collection('crm_contracts').getFullList({ requestKey: null });
      const statusCounts: Record<string, number> = {};
      allContracts.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });

      const colors: Record<string, string> = {
        '待签订': '#f59e0b',
        '执行中': '#3b82f6',
        '已完成': '#10b981',
        '已终止': '#ef4444',
      };

      const pieData = Object.entries(statusCounts).map(([name, count]) => ({
        name,
        value: Math.round((count / allContracts.length) * 100),
        color: colors[name] || '#888',
      }));
      setContractStatusData(pieData);

      // 4. Recent Activities
      const [recentCos, recentOpps, recentCons] = await Promise.all([
        pb.collection('crm_companies').getList(1, 5, { sort: '-created', expand: 'creator', requestKey: null }),
        pb.collection('crm_opportunities').getList(1, 5, { sort: '-created', expand: 'company,creator', requestKey: null }),
        pb.collection('crm_contracts').getList(1, 5, { sort: '-created', expand: 'company,creator', requestKey: null }),
      ]);

      const activities = [
        ...recentCos.items.map(i => ({ id: i.id, user: i.expand?.creator?.name || '系统', action: '新增了客户', target: i.name, time: new Date(i.created).toLocaleString(), type: 'company', rawTime: new Date(i.created) })),
        ...recentOpps.items.map(i => ({ id: i.id, user: i.expand?.creator?.name || '系统', action: '新增了商机', target: i.name, time: new Date(i.created).toLocaleString(), type: 'opportunity', rawTime: new Date(i.created) })),
        ...recentCons.items.map(i => ({ id: i.id, user: i.expand?.creator?.name || '系统', action: '新增了合同', target: i.name, time: new Date(i.created).toLocaleString(), type: 'contract', rawTime: new Date(i.created) })),
      ]
        .sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime())
        .slice(0, 5);

      setRecentActivities(activities);

      // 5. Leaderboard (Simple logic based on contract creator)
      // 注意：这里需要 expand 用户信息，假设 contract 有 creator 字段
      const contractsWithUsers = await pb.collection('crm_contracts').getFullList({
        expand: 'creator',
        requestKey: null,
      });
      const userPerformance: Record<string, { amount: number, count: number, name: string }> = {};

      contractsWithUsers.forEach(c => {
        const userName = c.expand?.creator?.name || '未知销售';
        if (!userPerformance[userName]) {
          userPerformance[userName] = { amount: 0, count: 0, name: userName };
        }
        userPerformance[userName].amount += c.amount || 0;
        userPerformance[userName].count++;
      });

      const leaderData = Object.values(userPerformance)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          amount: `¥${p.amount.toLocaleString()}`,
          count: p.count,
          growth: '+0%', // 模拟增长
          image: '👤'
        }));

      setLeaderboard(leaderData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 m-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            CRM 概览
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            欢迎回来，这是您的客户关系管理数据概览。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden md:flex" onClick={fetchData} disabled={loading}>
            {loading ? (
              <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarIcon className="mr-2 h-4 w-4" />
            )}
            刷新数据
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="总客户数"
          value={metrics.totalCompanies}
          change="+0%"
          trend="up"
          icon={BuildingOfficeIcon}
          description="总数"
          loading={loading}
        />
        <MetricCard
          title="活跃商机"
          value={metrics.activeOpportunities}
          change="+0%"
          trend="up"
          icon={BriefcaseIcon}
          description="跟进中"
          loading={loading}
        />
        <MetricCard
          title="合同总额"
          value={`¥${metrics.totalContractAmount.toLocaleString()}`}
          change="+0%"
          trend="up"
          icon={CurrencyYenIcon}
          description="有效合同"
          loading={loading}
        />
        <MetricCard
          title="平均成交周期"
          value={`${metrics.avgCycleDays}天`}
          change="-0%"
          trend="down"
          icon={UsersIcon}
          description="较上期"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>商机增长趋势</CardTitle>
            <CardDescription>展示过去一年新增商机的月度变化情况。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={opportunityTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#888' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#888' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>合同状态占比</CardTitle>
            <CardDescription>当前系统中所有合同的状态分布。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {contractStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {contractStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.name}</span>
                  <span className="ml-auto text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>最近动态</CardTitle>
              <CardDescription>CRM 模块最新的操作记录。</CardDescription>
            </div>
            <Button variant="ghost" size="sm">查看全部</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                    </div>
                  </div>
                ))
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b border-neutral-100 pb-4 last:border-0 last:pb-0 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                        {(() => {
                          const Icon = activity.type === 'opportunity' ? BriefcaseIcon :
                            activity.type === 'contract' ? DocumentTextIcon : BuildingOfficeIcon;
                          return <Icon className="h-5 w-5 text-neutral-500" />;
                        })()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          <span className="font-bold">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-xs text-neutral-500">{activity.target} • {activity.time}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-neutral-500">
                  暂无动态
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Top List */}
        <Card>
          <CardHeader>
            <CardTitle>销售排行榜</CardTitle>
            <CardDescription>本月业绩排名前五的销售人员。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-12 w-12 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                    </div>
                  </div>
                ))
              ) : leaderboard.length > 0 ? (
                leaderboard.map((person, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-2xl dark:bg-neutral-800">
                      {person.image}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{person.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-neutral-500">{person.count} 笔成交</span>
                        <span className="text-[10px] font-bold text-green-600">{person.growth}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{person.amount}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-neutral-500">
                  暂无排行榜数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
