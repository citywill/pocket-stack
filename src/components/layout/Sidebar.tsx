import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  UserIcon,
  Settings01Icon,
  ChartLineData01Icon,
  FileEditIcon,
  ShoppingCart01Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/components/auth-provider';

interface MenuItem {
  title: string;
  path: string;
  icon: any;
}

const menuItems: MenuItem[] = [
  {
    title: '仪表盘',
    path: '/',
    icon: Home01Icon,
  },
  {
    title: '用户管理',
    path: '/users',
    icon: UserIcon,
  },
  {
    title: '数据分析',
    path: '/analytics',
    icon: ChartLineData01Icon,
  },
  {
    title: '订单管理',
    path: '/orders',
    icon: ShoppingCart01Icon,
  },
  {
    title: '文档中心',
    path: '/documents',
    icon: FileEditIcon,
  },
  {
    title: '系统设置',
    path: '/settings',
    icon: Settings01Icon,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-200 px-6 dark:border-neutral-800">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
          Admin 后台
        </h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                className={cn(
                  'h-5 w-5',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {user?.name || '超级管理员'}
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {user?.email}
            </p>
          </div>
          <button 
            onClick={logout}
            className="text-neutral-500 hover:text-red-500 transition-colors p-1"
            title="退出登录"
          >
            <HugeiconsIcon icon={Logout01Icon} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
