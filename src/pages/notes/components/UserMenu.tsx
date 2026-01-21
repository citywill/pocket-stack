import { useAuth } from '@/components/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIcon,
  Logout01Icon,
  Settings01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { pb } from '@/lib/pocketbase';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const displayName = user.name || user.email || '用户';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = user.avatar ? pb.files.getUrl(user, user.avatar) : '';

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-full hover:bg-white/50 transition-all duration-200 group text-left outline-none p-2">
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email}
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={16}
              className="text-slate-400 group-hover:text-slate-600 transition-colors"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mt-1 rounded-2xl p-2 shadow-xl border-slate-100" align="start">
          <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            我的账户
          </DropdownMenuLabel>
          <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer focus:bg-blue-50 focus:text-blue-600">
            <HugeiconsIcon icon={UserIcon} size={18} />
            <span className="text-sm font-medium">个人资料</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer focus:bg-blue-50 focus:text-blue-600">
            <HugeiconsIcon icon={Settings01Icon} size={18} />
            <span className="text-sm font-medium">账户设置</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-slate-100" />
          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600"
            onClick={() => logout()}
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} />
            <span className="text-sm font-medium">退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
