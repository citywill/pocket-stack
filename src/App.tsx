import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { SettingsProvider } from '@/lib/use-settings';
import { AdminRoutes } from '@/pages/admin/routes';
import { Profile } from '@/pages/Profile';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from 'sonner';

import { ProtectedRoute } from '@/components/protected-route';

// 自动导入 modules 目录下的所有模块路由
const moduleRoutes = import.meta.glob('./modules/*/routes.tsx', { eager: true });
const autoRoutes = Object.values(moduleRoutes).map((mod: any) => {
  // 支持 export const routes = ... 或 export default ...
  return mod.routes || mod.default;
});

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Toaster position="top-center" richColors />
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              {/* 渲染自动注册的模块路由 */}
              {autoRoutes}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  {AdminRoutes}
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;