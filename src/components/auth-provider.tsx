import { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import type { AuthModel } from 'pocketbase';

interface AuthContextType {
  user: AuthModel | null;
  isValid: boolean;
  login: (email: string, password: string, isSuperAdmin?: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.model);
  const [isValid, setIsValid] = useState(pb.authStore.isValid);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 监听 authStore 的变化
    return pb.authStore.onChange((token, model) => {
      setUser(model);
      setIsValid(!!token);
    });
  }, []);

  useEffect(() => {
    // 验证当前的 auth token
    const initAuth = async () => {
      if (!pb.authStore.isValid || !pb.authStore.model) {
        setIsLoading(false);
        return;
      }

      try {
        // 刷新 auth 以确保仍然有效
        // 根据 model 所在的 collection 进行刷新
        const model = pb.authStore.model;
        const collectionName = model?.collectionName || (model?.username && !model?.email ? '_superusers' : 'users');
        await pb.collection(collectionName).authRefresh();
      } catch (err: any) {
        console.error('Auth refresh failed:', err);
        // 只有在明确的 401/403 认证错误时才清空，防止网络抖动导致登出
        if (err?.status === 401 || err?.status === 403) {
          pb.authStore.clear();
          setUser(null);
          setIsValid(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, isSuperAdmin: boolean = false) => {
    // 根据选择尝试不同类型的登录
    const collectionName = isSuperAdmin ? '_superusers' : 'users';
    const authData = await pb.collection(collectionName).authWithPassword(email, password);
    setUser(authData.record);
    setIsValid(true);
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
    setIsValid(false);
  };

  return (
    <AuthContext.Provider value={{ user, isValid, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
