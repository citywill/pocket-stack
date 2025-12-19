import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  UserIcon,
  Settings01Icon,
  ChartLineData01Icon,
  ShoppingCart01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { Logo } from '@/components/logo';
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
  children?: {
    title: string;
    path: string;
  }[];
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
    title: '数据中心',
    icon: ChartLineData01Icon,
    children: [
      { title: '数据分析', path: '/analytics' },
      { title: '文档中心', path: '/documents' },
    ],
  },
  {
    title: '订单管理',
    path: '/orders',
    icon: ShoppingCart01Icon,
  },
  {
    title: '系统设置',
    icon: Settings01Icon,
    children: [
      { title: '基本设置', path: '/settings' },
      { title: '个人信息', path: '/profile' },
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
        {menuItems.map((item, index) => (
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

