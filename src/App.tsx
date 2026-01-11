import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { SettingsProvider } from '@/lib/use-settings';
import { Dashboard } from '@/pages/task/Dashboard';
import { TaskRoutes } from '@/pages/task/routes';
import { CrmRoutes } from '@/pages/crm/routes';
import { AiAssistantRoutes } from '@/pages/AiAssistant/routes';
import { ExampleRoutes } from '@/pages/examples/routes';
import { PortalRoutes } from '@/pages/examples/portal/routes';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { Users } from '@/pages/admin/Users';
import { Settings } from '@/pages/admin/Settings';
import { Profile } from '@/pages/Profile';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from 'sonner';

import { ProtectedRoute, AdminOnlyRoute, UserOnlyRoute } from '@/components/protected-route';

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Toaster position="top-center" richColors />
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              {PortalRoutes}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="admin/dashboard" element={
                    <AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>
                  } />
                  <Route path="admin/users" element={
                    <AdminOnlyRoute>
                      <Users />
                    </AdminOnlyRoute>
                  } />
                  <Route path="admin/settings" element={
                    <AdminOnlyRoute>
                      <Settings />
                    </AdminOnlyRoute>
                  } />
                  {TaskRoutes}
                  <Route path="profile" element={<Profile />} />
                  {CrmRoutes}
                  {AiAssistantRoutes}
                  {ExampleRoutes}
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