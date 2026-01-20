import {
  Building01Icon,
  Briefcase01Icon,
  Agreement01Icon,
} from '@hugeicons/core-free-icons';

export const crmMenu = [
  {
    title: '客户单位',
    path: '/crm/companies',
    icon: Building01Icon,
    userOnly: true,
  },
  {
    title: '商机管理',
    path: '/crm/opportunities',
    icon: Briefcase01Icon,
    userOnly: true,
  },
  {
    title: '合同管理',
    path: '/crm/contracts',
    icon: Agreement01Icon,
    userOnly: true,
  },
];
