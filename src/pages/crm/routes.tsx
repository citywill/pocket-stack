import { Route } from 'react-router-dom';
import Companies from './Companies';
import Opportunities from './Opportunities';
import Contracts from './Contracts';

export const CrmRoutes = (
  <>
    <Route path="crm/companies" element={<Companies />} />
    <Route path="crm/opportunities" element={<Opportunities />} />
    <Route path="crm/contracts" element={<Contracts />} />
  </>
);
