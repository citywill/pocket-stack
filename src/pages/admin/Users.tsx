import { useEffect, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatar: string;
  created: string;
  verified: boolean;
}

export function Users() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
    verified: false,
    avatar: null as File | null,
  });

  const fetchUsers = async (page = currentPage, limit = perPage, search = searchTerm) => {
    setLoading(true);
    try {
      const filter = search
        ? `(name ~ "${search}" || email ~ "${search}")`
        : '';

      const result = await pb.collection('users').getList<UserRecord>(page, limit, {
        sort: '-created',
        filter: filter,
      });

      setUsers(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
      // 如果当前页超过了总页数，重置到第一页
      if (result.totalPages > 0 && page > result.totalPages) {
        setCurrentPage(1);
      }
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch users:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 监听分页和每页数量变化
  useEffect(() => {
    fetchUsers(currentPage, perPage, searchTerm);
  }, [currentPage, perPage]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // 搜索时重置到第一页
      fetchUsers(1, perPage, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenDialog = (user?: UserRecord) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        password: '',
        passwordConfirm: '',
        verified: user.verified,
        avatar: null,
      });
      if (user.avatar) {
        setAvatarPreview(`${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`);
      } else {
        setAvatarPreview(null);
      }
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        name: '',
        password: '',
        passwordConfirm: '',
        verified: false,
        avatar: null,
      });
      setAvatarPreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('verified', String(formData.verified));

      if (formData.avatar) {
        data.append('avatar', formData.avatar);
      }

      if (formData.password) {
        data.append('password', formData.password);
        data.append('passwordConfirm', formData.passwordConfirm);
      }

      if (editingUser) {
        await pb.collection('users').update(editingUser.id, data);
        toast.success('更新成功');
      } else {
        data.append('email', formData.email);
        data.append('emailVisibility', 'true');
        await pb.collection('users').create(data);
        toast.success('创建成功');
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(error.message || '保存失败，请检查输入或权限');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await pb.collection('users').delete(deleteTargetId);
      toast.success('删除成功');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || '删除失败');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 text-maia">
            用户管理
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            连接 PocketBase 后端管理系统用户
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchUsers()} disabled={loading} className="bg-white dark:bg-neutral-950">
            <ArrowPathIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenDialog()}>
            <PlusIcon className="mr-2 h-4 w-4" />
            添加用户
          </Button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <Input
          placeholder="搜索用户名或邮箱..."
          className="pl-9 bg-white dark:bg-neutral-950 h-11 ring-offset-white focus-visible:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-neutral-500">
            用户列表 ({totalItems})
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">每页</span>
            <Select
              value={perPage.toString()}
              onValueChange={(val) => {
                setPerPage(parseInt(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-neutral-950">
                <SelectValue placeholder={perPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: perPage }).map((_, i) => (
              <div key={i} className="h-[200px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 animate-pulse" />
            ))
          ) : users.length === 0 ? (
            <div className="col-span-full py-20 bg-white/50 dark:bg-neutral-950/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                <MagnifyingGlassIcon className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500">没有发现符合条件的用户</p>
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>清除搜索</Button>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="group relative flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-xl hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 overflow-hidden ring-2 ring-white dark:ring-neutral-800 shadow-sm">
                      {user.avatar ? (
                        <img
                          src={`${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                        {user.name}
                      </h3>
                      <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase">
                        ID: {user.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={user.verified ? "default" : "secondary"}
                    className={cn(
                      "rounded-lg shrink-0 text-[10px] px-2 py-0",
                      user.verified ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20" : ""
                    )}
                  >
                    {user.verified ? "已验证" : "待验证"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <EnvelopeIcon className="h-3.5 w-3.5 opacity-70 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <CalendarIcon className="h-3.5 w-3.5 opacity-70 shrink-0" />
                    <span>{new Date(user.created).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-[11px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <PencilSquareIcon className="mr-1.5 h-3.5 w-3.5" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => handleDeleteClick(user.id)}
                  >
                    <TrashIcon className="mr-1.5 h-3.5 w-3.5" />
                    删除
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs text-neutral-500">
              显示第 {(currentPage - 1) * perPage + 1} 到 {Math.min(currentPage * perPage, totalItems)} 条，共 {totalItems} 条用户
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 dark:bg-neutral-950"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                上一页
              </Button>

              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-medium">{currentPage}</span>
                <span className="text-sm text-neutral-400">/</span>
                <span className="text-sm text-neutral-400">{totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 dark:bg-neutral-950"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                下一页
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '添加新用户'}</DialogTitle>
            <DialogDescription>
              填写用户信息。用户名将作为用户的唯一标识。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-4 pb-4">
              <div className="relative group">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 transition-colors group-hover:border-blue-500 shadow-inner">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-10 w-10 text-neutral-400" />
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                  >
                    <PhotoIcon className="h-6 w-6" />
                  </label>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-full">点击头像上传图片</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">用户名</Label>
              <Input
                id="name"
                autoComplete="off"
                placeholder="例如: admin123"
                className="h-10 border-neutral-200 dark:border-neutral-800"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            {!editingUser && (
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="off"
                  placeholder="name@example.com"
                  className="h-10 border-neutral-200 dark:border-neutral-800"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {editingUser ? '重置密码 (留空则不修改)' : '密码'}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                className="h-10 border-neutral-200 dark:border-neutral-800"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>
            {formData.password && (
              <div className="grid gap-2">
                <Label htmlFor="passwordConfirm" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">确认密码</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  className="h-10 border-neutral-200 dark:border-neutral-800"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="verified"
                checked={formData.verified}
                onCheckedChange={(checked) => setFormData({ ...formData, verified: checked === true })}
              />
              <label
                htmlFor="verified"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-neutral-600 dark:text-neutral-400"
              >
                验证用户
              </label>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">确认保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除该用户吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。该用户的所有关联数据也将受到影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              确定删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



