import { Building01Icon } from '@hugeicons/core-free-icons';

export const crmMenu = {
  title: 'CRM管理',
  icon: Building01Icon,
  userOnly: true,
  children: [
    { title: '客户单位', path: '/crm/companies' },
    { title: '商机管理', path: '/crm/opportunities' },
    { title: '合同管理', path: '/crm/contracts' },
  ],
};
