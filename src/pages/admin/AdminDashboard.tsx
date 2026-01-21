import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIcon
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/components/auth-provider';
import { pb } from '@/lib/pocketbase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created: string;
  updated: string;
}

// Custom tooltip style
const CustomTooltip = ({ active, payload, label, unit = "个用户" }: any) => {
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

export function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: '活跃用户', value: '0', icon: UserIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/50' },
    { title: '总用户数', value: '0', icon: UserIcon, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/50' },
  ]);

  // Chart data
  const [userTrendData, setUserTrendData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch all users
        const usersResult = await pb.collection('users').getFullList<User>({
          sort: '-created',
          signal: undefined,
        });
        setUsers(usersResult);

        // Update stats
        const activeUsers = usersResult.length;
        const totalUsers = usersResult.length;

        setStats([
          { title: '活跃用户', value: activeUsers.toString(), icon: UserIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/50' },
          { title: '总用户数', value: totalUsers.toString(), icon: UserIcon, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/50' },
        ]);

        // Prepare user trend data (group by day)
        const userTrendMap: { [key: string]: number } = {};
        usersResult.forEach(user => {
          if (user.created) {
            const date = new Date(user.created);
            const dayKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            userTrendMap[dayKey] = (userTrendMap[dayKey] || 0) + 1;
          }
        });

        // Convert to array and sort by date
        const userTrendArray = Object.entries(userTrendMap).map(([date, count]) => ({
          date,
          count
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setUserTrendData(userTrendArray);
      } catch (error: any) {
        if (!error.isAbort) {
          console.error('Failed to fetch data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          管理员仪表盘
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          全局数据概览
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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

      {/* User Chart Section */}
      <div className="grid gap-6">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold">用户注册趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <p className="text-neutral-500">加载中...</p>
                </div>
              </div>
            ) : userTrendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">暂无数据</p>
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
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
                    <Tooltip content={<CustomTooltip unit="个用户" />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      animationDuration={1500}
                      animationBegin={200}
                      activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 4, fill: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Section */}
      <div className="grid gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold">最新注册用户</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <p className="text-neutral-500">加载中...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">暂无用户数据</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <img
                          src={`${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`}
                          alt={user.name || user.email}
                          className="rounded-full h-12 w-12 object-cover"
                        />
                      ) : (
                        <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3">
                          <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{user.name || user.email}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-500">{user.email}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-600">注册于: {new Date(user.created).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                      活跃用户
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