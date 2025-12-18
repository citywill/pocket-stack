import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Menu01Icon, 
  Notification01Icon, 
  Search01Icon, 
  Logout01Icon, 
  SidebarLeft01Icon,
  SidebarRight01Icon
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ onMenuClick, isCollapsed, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className={cn(
      "fixed right-0 top-0 z-30 h-16 border-b border-neutral-200 bg-white/80 backdrop-blur-sm transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950/80",
      isCollapsed ? "left-20" : "left-64"
    )}>
      <div className="flex h-full items-center justify-between px-6">
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
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <HugeiconsIcon icon={Menu01Icon} className="h-5 w-5" />
          </Button>

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
              <button className="ml-2 flex items-center gap-3 outline-none cursor-pointer group">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 transition-colors">
                    {user?.name || '超级管理员'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {user?.email}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white group-hover:bg-blue-700 transition-colors">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={logout}
                className="cursor-pointer"
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
