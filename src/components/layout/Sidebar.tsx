import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  PrismIcon,
  AiChat02Icon,
  ChartLineData01Icon,
  Task01Icon,
  Calendar01Icon,
  Building01Icon,
  DatabaseIcon,
  ArrowDown01Icon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import { Logo } from '@/components/logo';
import { useAuth } from '@/components/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface MenuItem {
  title: string;
  path?: string;
  icon: any; // 使用 any 以兼容 Hugeicons 图标类型
  adminOnly?: boolean;
  userOnly?: boolean;
  children?: {
    title: string;
    path: string;
    adminOnly?: boolean;
    userOnly?: boolean;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: '仪表盘',
    path: '/',
    icon: Home01Icon,
    userOnly: true,
  },
  {
    title: '仪表盘',
    path: '/admin/dashboard',
    icon: ChartLineData01Icon,
    adminOnly: true,
  },
  {
    title: '任务管理',
    path: '/tasks',
    icon: Task01Icon,
    userOnly: true,
  },
  {
    title: '任务日历',
    path: '/calendar',
    icon: Calendar01Icon,
    userOnly: true,
  },
  {
    title: 'CRM管理',
    icon: Building01Icon,
    userOnly: true,
    children: [
      { title: '客户单位', path: '/crm/companies' },
    ],
  },
  {
    title: 'AI 助手',
    path: '/examples/ai-playground',
    userOnly: true,
    icon: AiChat02Icon
  },
  {
    title: 'AI 数据助手',
    path: '/ai-assistant',
    // userOnly: true,
    icon: DatabaseIcon
  },
  {
    title: '前端示例',
    icon: PrismIcon,
    children: [
      { title: '仪表盘', path: '/examples/dashboard' },
      { title: '空页面', path: '/examples/blank' },
      { title: '表格', path: '/examples/table' },
      { title: '卡片', path: '/examples/card' },
      { title: '表单', path: '/examples/form' },
      { title: '博客详情', path: '/examples/blog-detail' },
    ],
  },
  {
    title: '系统管理',
    icon: Settings01Icon,
    adminOnly: true,
    children: [
      { title: '全局配置', path: '/admin/settings' },
      { title: '用户管理', path: '/admin/users' },
      { title: '智能体管理', path: '/examples/ai-agents', adminOnly: true },
    ],
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({ isCollapsed, className, onItemClick }: SidebarProps) {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  // 过滤菜单项
  const filteredMenuItems = menuItems.filter(item => {
    if (isSuperAdmin) {
      // 管理员可以看到adminOnly和不加限定的菜单
      return !item.userOnly;
    }
    if (item.adminOnly && !isSuperAdmin) return false;
    if (item.userOnly && isSuperAdmin) return false;
    return true;
  }).map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => {
          if (isSuperAdmin) {
            // 管理员可以看到adminOnly和不加限定的子菜单
            return !child.userOnly;
          }
          if (child.adminOnly && !isSuperAdmin) return false;
          if (child.userOnly && isSuperAdmin) return false;
          return true;
        })
      };
    }
    return item;
  });

  return (
    <aside className={cn(
      "h-full border-r border-neutral-200 bg-white transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950",
      isCollapsed ? "w-20" : "w-64",
      className
    )}>
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-neutral-200 dark:border-neutral-800",
        isCollapsed ? "justify-center px-0" : "px-6"
      )}>
        <Logo showText={!isCollapsed} />
      </div>

      {/* Navigation */}
      <nav className="space-y-1 overflow-y-auto p-4" style={{ height: 'calc(100vh - 4rem)' }}>
        {filteredMenuItems.map((item, index) => (
          <NavItem
            key={index}
            item={item}
            location={location}
            isCollapsed={isCollapsed}
            onClick={onItemClick}
          />
        ))}
      </nav>
    </aside>
  );
}

function NavItem({
  item,
  location,
  isCollapsed,
  onClick
}: {
  item: MenuItem;
  location: ReturnType<typeof useLocation>;
  isCollapsed?: boolean;
  onClick?: () => void;
}) {
  const hasChildren = !!item.children;
  const isChildActive = item.children?.some(child => location.pathname === child.path);
  const [isOpen, setIsOpen] = useState(isChildActive);

  const isActive = item.path ? location.pathname === item.path : false;

  const handleLinkClick = () => {
    if (onClick) onClick();
  };

  if (!hasChildren) {
    return (
      <Link
        to={item.path!}
        title={isCollapsed ? item.title : undefined}
        onClick={handleLinkClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
          isCollapsed && "justify-center px-0"
        )}
      >
        <HugeiconsIcon
          icon={item.icon}
          className={cn(
            'h-5 w-5 shrink-0',
            isActive
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-neutral-500 dark:text-neutral-400'
          )}
        />
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    );
  }

  // 折叠状态下的弹出菜单
  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 outline-none',
              isChildActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
            )}
          >
            <HugeiconsIcon
              icon={item.icon}
              className={cn(
                'h-5 w-5 shrink-0',
                isChildActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={16} className="min-w-40">
          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.children?.map((child) => (
            <DropdownMenuItem key={child.path} asChild>
              <Link
                to={child.path}
                onClick={handleLinkClick}
                className={cn(
                  "w-full",
                  location.pathname === child.path && "text-blue-600 font-medium"
                )}
              >
                {child.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
          isChildActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
        )}
      >
        <div className="flex items-center gap-3">
          <HugeiconsIcon
            icon={item.icon}
            className={cn(
              'h-5 w-5 shrink-0',
              isChildActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          />
          <span>{item.title}</span>
        </div>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      {isOpen && (
        <div className="space-y-1">
          {item.children?.map((child) => {
            const isChildActive = location.pathname === child.path;
            return (
              <Link
                key={child.path}
                to={child.path}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isChildActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                )}
              >
                {/* 占位符空间 */}
                <div className="w-5" />
                <span>{child.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}





