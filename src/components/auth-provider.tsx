import { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import type { AuthModel } from 'pocketbase';

interface AuthContextType {
  user: AuthModel | null;
  isValid: boolean;
  login: (email: string, password: string) => Promise<void>;
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
      try {
        if (pb.authStore.isValid) {
          // 刷新 auth 以确保仍然有效
          await pb.collection('_superusers').authRefresh();
        }
      } catch {
        pb.authStore.clear();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // 尝试作为超级用户登录
    await pb.collection('_superusers').authWithPassword(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
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
