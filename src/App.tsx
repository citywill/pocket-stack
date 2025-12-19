import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Dashboard } from '@/pages/dashboard';
import { Users } from '@/pages/Users';
import { Analytics } from '@/pages/analytics';
import { Orders } from '@/pages/orders';
import { Documents } from '@/pages/documents';
import { Settings } from '@/pages/settings';
import { Profile } from '@/pages/profile';
import { LoginPage } from '@/pages/login';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { ProtectedRoute, AdminOnlyRoute } from '@/components/protected-route';

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={
                  <AdminOnlyRoute>
                    <Users />
                  </AdminOnlyRoute>
                } />
                <Route path="analytics" element={<Analytics />} />
                <Route path="orders" element={<Orders />} />
                <Route path="documents" element={<Documents />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;