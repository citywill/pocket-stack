import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Bookmark01Icon,
  HourglassIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  updated?: string;
  created?: string;
}

const statusMap = {
  todo: { label: '待办', color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', icon: Bookmark01Icon, chartColor: '#6b7280', gradient: ['#6b7280', '#9ca3af'] },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', icon: HourglassIcon, chartColor: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400', icon: CheckmarkCircle01Icon, chartColor: '#10b981', gradient: ['#10b981', '#34d399'] },
};

const priorityMap = {
  low: { label: '低', color: 'text-neutral-500' },
  medium: { label: '中', color: 'text-blue-500' },
  high: { label: '高', color: 'text-red-500' },
};

// Custom tooltip style
const CustomTooltip = ({ active, payload, label, unit = "个任务" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-4 py-3 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {payload[0].value} <span className="text-xs text-neutral-400">{unit}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom pie tooltip
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="px-4 py-3 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">{data.name}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{data.value} 个任务</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">占比: {(payload[0].percent ? payload[0].percent * 100 : 0).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: '待办任务', value: '0', icon: Bookmark01Icon, color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-50 dark:bg-neutral-900/50' },
    { title: '进行中', value: '0', icon: HourglassIcon, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50' },
    { title: '已完成', value: '0', icon: CheckmarkCircle01Icon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/50' },
    { title: '总任务', value: '0', icon: Bookmark01Icon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/50' },
  ]);

  // Chart data
  const [trendData, setTrendData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        const result = await pb.collection('tasks').getFullList<Task>({
          filter: `user = "${user.id}" && archived = false`,
          sort: '-created',
        });
        setTasks(result);

        // Update stats
        const todoCount = result.filter(t => t.status === 'todo').length;
        const inProgressCount = result.filter(t => t.status === 'in_progress').length;
        const completedCount = result.filter(t => t.status === 'completed').length;
        const totalCount = result.length;

        setStats([
          { title: '待办任务', value: todoCount.toString(), icon: Bookmark01Icon, color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-50 dark:bg-neutral-900/50' },
          { title: '进行中', value: inProgressCount.toString(), icon: HourglassIcon, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50' },
          { title: '已完成', value: completedCount.toString(), icon: CheckmarkCircle01Icon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/50' },
          { title: '总任务', value: totalCount.toString(), icon: Bookmark01Icon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/50' },
        ]);

        // Prepare status distribution data
        setStatusData([
          { name: '待办', value: todoCount, color: statusMap.todo.chartColor, gradient: statusMap.todo.gradient },
          { name: '进行中', value: inProgressCount, color: statusMap.in_progress.chartColor, gradient: statusMap.in_progress.gradient },
          { name: '已完成', value: completedCount, color: statusMap.completed.chartColor, gradient: statusMap.completed.gradient },
        ]);

        // Prepare trend data (group by day)
        const trendMap: { [key: string]: number } = {};
        result.forEach(task => {
          if (task.created) {
            const date = new Date(task.created);
            const dayKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            trendMap[dayKey] = (trendMap[dayKey] || 0) + 1;
          }
        });

        // Convert to array and sort by date
        const trendArray = Object.entries(trendMap).map(([date, count]) => ({
          date,
          count
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setTrendData(trendArray);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          仪表盘
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          欢迎回来，这是您的任务概览
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          return (
            <Card key={stat.title} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor} transition-transform hover:scale-110`}>
                    <HugeiconsIcon icon={stat.icon} className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold">任务创建趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <p className="text-neutral-500">加载中...</p>
                </div>
              </div>
            ) : trendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(5)}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip unit="个任务" />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    animationDuration={1500}
                    animationBegin={200}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 4, fill: '#ffffff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold">任务状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <p className="text-neutral-500">加载中...</p>
                </div>
              </div>
            ) : statusData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <defs>
                    {statusData.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.3} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    animationBegin={200}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks Section */}
      <div className="grid gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold">最近任务</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <p className="text-neutral-500">加载中...</p>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">暂无任务数据</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`rounded-full p-2 ${statusMap[task.status].color} transition-transform hover:scale-110`}>
                        <HugeiconsIcon icon={statusMap[task.status].icon} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{task.title}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-500">优先级: {priorityMap[task.priority].label}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-600">创建于: {task.created ? new Date(task.created).toLocaleDateString() : '未知'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                        task.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                          'bg-neutral-50 dark:bg-neutral-900/20 text-neutral-600 dark:text-neutral-400'
                    )}>
                      {statusMap[task.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}