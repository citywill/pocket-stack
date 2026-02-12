import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EnvelopeIcon, LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { Logo } from '@/components/logo';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password, isSuperAdmin);
      // 登录成功后跳转到对应仪表盘
      navigate(isSuperAdmin ? '/admin/dashboard' : '/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('登录失败，请检查账号和密码是否正确');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo className="scale-125" />
        </div>
        <Card className="w-full">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">后台管理系统</CardTitle>
            <CardDescription>
              {isSuperAdmin ? '以超级管理员身份登录' : '以普通用户身份登录'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">账号 (邮箱)</Label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="isSuperAdmin"
                  checked={isSuperAdmin}
                  onCheckedChange={(checked) => setIsSuperAdmin(checked === true)}
                />
                <label
                  htmlFor="isSuperAdmin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-neutral-600 dark:text-neutral-400"
                >
                  超级管理员登录
                </label>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                登录
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              没有账号?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                立即注册
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}