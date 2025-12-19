import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Menu01Icon, 
  Cancel01Icon,
  Notification01Icon, 
  Search01Icon, 
  Logout01Icon, 
  SidebarLeft01Icon,
  SidebarRight01Icon,
  UserIcon
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { pb } from '@/lib/pocketbase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ onMenuClick, isCollapsed, isMobileOpen, onToggleSidebar }: HeaderProps) {
  const { user, logout, isSuperAdmin } = useAuth();

  const avatarUrl = user?.avatar 
    ? `${pb.baseUrl}/api/files/${user.collectionName || (isSuperAdmin ? '_superusers' : 'users')}/${user.id}/${user.avatar}`
    : null;

  return (
    <header className={cn(
      "fixed right-0 top-0 z-30 h-16 border-b border-neutral-200 bg-white/80 backdrop-blur-sm transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950/80",
      "lg:left-64",
      isCollapsed && "lg:left-20",
      "left-0"
    )}>
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden lg:flex bg-white dark:bg-neutral-950"
            title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            <HugeiconsIcon 
              icon={isCollapsed ? SidebarRight01Icon : SidebarLeft01Icon} 
              className="h-5 w-5 text-neutral-500" 
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn("lg:hidden", isMobileOpen && "bg-neutral-100 dark:bg-neutral-800")}
            onClick={onMenuClick}
          >
            <HugeiconsIcon icon={isMobileOpen ? Cancel01Icon : Menu01Icon} className="h-5 w-5" />
          </Button>

          <Logo className="lg:hidden scale-90" />

          {/* Search */}
          <div className="relative hidden md:block">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="search"
              placeholder="搜索..."
              className="w-64 pl-9 bg-white dark:bg-neutral-950"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          
          <Button variant="outline" size="icon" className="relative border-1 bg-white dark:bg-neutral-950">
            <HugeiconsIcon icon={Notification01Icon} className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 flex items-center gap-3 outline-none group">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 transition-colors">
                    {user?.name || (isSuperAdmin ? '超级管理员' : '普通用户')}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {user?.email} {isSuperAdmin && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded dark:bg-blue-900/40 dark:text-blue-400 ml-1">Admin</span>}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white group-hover:bg-blue-700 transition-colors overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    user?.email?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center cursor-pointer">
                  <HugeiconsIcon icon={UserIcon} className="mr-2 h-4 w-4" />
                  <span>个人信息</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="cursor-pointer text-red-600 focus:text-red-700"
              >
                <HugeiconsIcon icon={Logout01Icon} className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
