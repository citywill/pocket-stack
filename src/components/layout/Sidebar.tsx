import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Logo } from '@/components/logo';
import { useAuth } from '@/components/auth-provider';
import { menuItems, type MenuItem } from '../menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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

  // 检查菜单项是否激活
  const checkActive = (menuItem: MenuItem) => {
    const currentPath = location.pathname;
    
    // 1. 优先使用 activePath 正则匹配
    if (menuItem.activePath) {
      try {
        const regex = new RegExp(menuItem.activePath);
        if (regex.test(currentPath)) return true;
      } catch (e) {
        // 如果不是有效的正则，尝试作为路径前缀匹配
        if (currentPath.startsWith(menuItem.activePath)) return true;
      }
    }
    
    // 2. 默认路径精确匹配
    return menuItem.path ? currentPath === menuItem.path : false;
  };

  const isActive = checkActive(item);
  const Icon = item.icon;

  const handleLinkClick = () => {
    if (onClick) onClick();
  };

  if (!hasChildren) {
    const linkProps = item.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
    return (
      <Link
        to={item.path!}
        title={isCollapsed ? item.title : undefined}
        onClick={handleLinkClick}
        {...linkProps}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
          isCollapsed && "justify-center px-0"
        )}
      >
        <Icon
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
            <Icon
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
          {item.children?.map((child) => {
            const childLinkProps = child.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
            return (
              <DropdownMenuItem key={child.path} asChild>
                <Link
                  to={child.path}
                  onClick={handleLinkClick}
                  {...childLinkProps}
                  className={cn(
                    "w-full",
                    location.pathname === child.path && "text-blue-600 font-medium"
                  )}
                >
                  {child.title}
                </Link>
              </DropdownMenuItem>
            );
          })}
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
            ? 'text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              'h-5 w-5 shrink-0',
              isChildActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          />
          <span>{item.title}</span>
        </div>
        <ChevronDownIcon
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
            const childLinkProps = child.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
            return (
              <Link
                key={child.path}
                to={child.path}
                onClick={handleLinkClick}
                {...childLinkProps}
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
