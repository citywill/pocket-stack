import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { SettingsProvider } from '@/lib/use-settings';
import { Dashboard } from '@/pages/task/Dashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { Users } from '@/pages/admin/Users';
import { Settings } from '@/pages/admin/Settings';
import { Profile } from '@/pages/Profile';
import { Tasks } from '@/pages/task/Tasks';
import { CalendarPage } from '@/pages/task/Calendar';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';
import { ExampleDashboard } from '@/pages/examples/Dashboard';
import { ExampleTable } from '@/pages/examples/Table';
import { ExampleCard } from '@/pages/examples/Card';
import { Form } from '@/pages/examples/Form';
import { Blank } from '@/pages/examples/Blank';
import { BlogDetail } from '@/pages/examples/BlogDetail';
import { AIPlayground } from '@/pages/examples/AIPlayground';
import { AIAgents } from '@/pages/examples/AIAgents';
import AiAssistant from '@/pages/AiAssistant/AiAssistant';
import Companies from '@/pages/crm/Companies';
import Opportunities from '@/pages/crm/Opportunities';
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
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="crm/companies" element={<Companies />} />
                  <Route path="crm/opportunities" element={<Opportunities />} />
                  <Route path="ai-assistant" element={<AiAssistant />} />
                  <Route path="examples/blank" element={<Blank />} />
                  <Route path="examples/dashboard" element={<ExampleDashboard />} />
                  <Route path="examples/table" element={<ExampleTable />} />
                  <Route path="examples/card" element={<ExampleCard />} />
                  <Route path="examples/form" element={<Form />} />
                  <Route path="examples/blog-detail" element={<BlogDetail />} />
                  <Route path="examples/ai-playground" element={
                    <UserOnlyRoute>
                      <AIPlayground />
                    </UserOnlyRoute>
                  } />
                  <Route path="examples/ai-agents" element={
                    <AdminOnlyRoute>
                      <AIAgents />
                    </AdminOnlyRoute>
                  } />
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