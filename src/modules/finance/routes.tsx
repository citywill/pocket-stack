import { Route } from 'react-router-dom';
import FinanceDashboard from './Index';
import FinanceRecords from './Records';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="finance" element={<FinanceDashboard />} />
      <Route path="finance/records" element={<FinanceRecords />} />
    </Route>
  </Route>
);
