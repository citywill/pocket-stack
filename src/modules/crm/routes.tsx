import { Route } from 'react-router-dom';
import CrmDashboard from './Dashboard';
import Companies from './Companies';
import Opportunities from './Opportunities';
import Contracts from './Contracts';
import { MainLayout } from '@/components/layout';

export const routes = (
  <Route element={<MainLayout />}>
    <Route path="crm/dashboard" element={<CrmDashboard />} />
    <Route path="crm/companies" element={<Companies />} />
    <Route path="crm/opportunities" element={<Opportunities />} />
    <Route path="crm/contracts" element={<Contracts />} />
  </Route>
);
