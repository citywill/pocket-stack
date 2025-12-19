import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  UserIcon, 
  Mail01Icon, 
  ImageAdd01Icon, 
  Loading01Icon,
  Tick01Icon,
  AlertCircleIcon
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/components/auth-provider';
import { pb } from '@/lib/pocketbase';

export function Profile() {
  const { user, isSuperAdmin, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: null as File | null,
  });

  useEffect(() => {
    if (user?.avatar) {
      const collection = user.collectionName || (isSuperAdmin ? '_superusers' : 'users');
      setAvatarPreview(`${pb.baseUrl}/api/files/${collection}/${user.id}/${user.avatar}`);
    }
  }, [user, isSuperAdmin]);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.avatar) {
        data.append('avatar', formData.avatar);
      }

      const collection = user?.collectionName || (isSuperAdmin ? '_superusers' : 'users');
      await pb.collection(collection).update(user!.id, data);
      
      setMessage({ type: 'success', text: '个人基本信息更新成功！' });
    } catch (error: any) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: '基本信息更新失败：' + (error.message || '未知错误') });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '新密码与确认密码不一致' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const collection = user?.collectionName || (isSuperAdmin ? '_superusers' : 'users');
      // 1. 更新密码
      await pb.collection(collection).update(user!.id, {
        oldPassword: formData.oldPassword,
        password: formData.newPassword,
        passwordConfirm: formData.confirmPassword,
      });

      // 2. 重新认证以保持登录状态 (PocketBase 修改密码后会使旧 Token 失效)
      if (user?.email) {
        await login(user.email, formData.newPassword, isSuperAdmin);
      }

      setFormData({ ...formData, oldPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: '密码修改成功，会话已同步！' });
    } catch (error: any) {
      console.error('Change password error:', error);
      setMessage({ type: 'error', text: '密码修改失败：' + (error.message || '请检查原密码是否正确') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 text-maia">
          个人中心
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          查看并管理您的个人账户信息
        </p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          <HugeiconsIcon icon={message.type === 'success' ? Tick01Icon : AlertCircleIcon} className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side: Photo & Basic Info */}
        <div className="md:col-span-4 space-y-6">
          <Card className="overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardContent className="pt-8 flex flex-col items-center">
              <div className="relative group">
                <div className="h-32 w-32 rounded-3xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-neutral-900 shadow-xl group-hover:shadow-blue-500/10 transition-all duration-300">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <HugeiconsIcon icon={UserIcon} className="h-12 w-12 text-neutral-400" />
                  )}
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                  >
                    <HugeiconsIcon icon={ImageAdd01Icon} className="h-8 w-8" />
                  </label>
                </div>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              
              <div className="mt-6 text-center">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{user?.name || '管理员'}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isSuperAdmin ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    {isSuperAdmin ? 'Super Admin' : 'Regular User'}
                  </span>
                </div>
              </div>

              <div className="w-full mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4 text-neutral-400" />
                  <span className="truncate">{user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Forms */}
        <div className="md:col-span-8 space-y-6">
          <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>更新您的姓名或上传新的头像图片</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">用户名 / 昵称</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="请输入您的姓名"
                    className="h-10 border-neutral-200 dark:border-neutral-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="opacity-50">邮箱地址 (不可修改)</Label>
                  <Input 
                    id="email" 
                    value={formData.email} 
                    disabled
                    className="h-10 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  {loading && <HugeiconsIcon icon={Loading01Icon} className="mr-2 h-4 w-4 animate-spin" />}
                  保存个人信息
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>重置密码</CardTitle>
              <CardDescription>为了安全，请定期更换您的登录密码</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 grid gap-2">
                    <Label htmlFor="oldPassword">当前密码</Label>
                    <Input 
                      id="oldPassword" 
                      type="password"
                      value={formData.oldPassword}
                      onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
                      className="h-10 border-neutral-200 dark:border-neutral-800"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="h-10 border-neutral-200 dark:border-neutral-800"
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="h-10 border-neutral-200 dark:border-neutral-800"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  variant="outline"
                  disabled={loading}
                  className="mt-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  {loading && <HugeiconsIcon icon={Loading01Icon} className="mr-2 h-4 w-4 animate-spin" />}
                  重置登录密码
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
