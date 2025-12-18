import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  UserIcon, 
  Mail01Icon, 
  Calendar01Icon, 
  Delete01Icon, 
  PencilEdit01Icon,
  Add01Icon,
  RefreshIcon,
  Search01Icon,
  ImageAdd01Icon
} from '@hugeicons/core-free-icons';
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

import { Checkbox } from '@/components/ui/checkbox';

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
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
    verified: false,
    avatar: null as File | null,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('users').getFullList<UserRecord>({
        sort: '-created',
      });
      setUsers(records);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      // 如果用户有头像，设置预览
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
      } else {
        data.append('email', formData.email);
        data.append('emailVisibility', 'true');
        await pb.collection('users').create(data);
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('保存失败，请检查输入或权限');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除该用户吗？')) {
      try {
        await pb.collection('users').delete(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('删除失败');
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
          <Button variant="outline" onClick={fetchUsers} disabled={loading} className="bg-white dark:bg-neutral-950">
            <HugeiconsIcon icon={RefreshIcon} className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenDialog()}>
            <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
            添加用户
          </Button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="relative">
        <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <Input
          placeholder="搜索用户名或邮箱..."
          className="pl-9 bg-white dark:bg-neutral-950"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-950/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>用户列表 ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 animate-pulse" />
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-neutral-500">
                暂无用户数据
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="group relative flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 overflow-hidden">
                        {user.avatar ? (
                          <img 
                            src={`${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`} 
                            alt={user.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <HugeiconsIcon icon={UserIcon} className="h-6 w-6" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          用户ID: {user.id}
                        </p>
                      </div>
                    </div>
                    <Badge variant={user.verified ? "default" : "secondary"} className="rounded-lg shrink-0">
                      {user.verified ? "已验证" : "待验证"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4 opacity-70 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 opacity-70 shrink-0" />
                      <span>注册时间: {new Date(user.created).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} className="mr-2 h-4 w-4" />
                      编辑
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleDelete(user.id)}
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

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
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 transition-colors group-hover:border-blue-500">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <HugeiconsIcon icon={UserIcon} className="h-10 w-10 text-neutral-400" />
                  )}
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <HugeiconsIcon icon={ImageAdd01Icon} className="h-6 w-6" />
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
              <p className="text-xs text-neutral-500">点击头像更换图片</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">用户名</Label>
              <Input
                id="name"
                autoComplete="off"
                placeholder="例如: admin123"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            {!editingUser && (
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="off"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="password">{editingUser ? '重置密码 (留空则不修改)' : '密码'}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>
            {formData.password && (
              <div className="grid gap-2">
                <Label htmlFor="passwordConfirm">确认密码</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                验证用户
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


