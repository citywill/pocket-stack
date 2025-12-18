import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, Notification01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/mode-toggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
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
              className="w-64 pl-9"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          
          <Button variant="ghost" size="icon" className="relative">
            <HugeiconsIcon icon={Notification01Icon} className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          <div className="ml-2 flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                管理员
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                超级管理员
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
