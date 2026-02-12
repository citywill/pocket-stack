import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const menu = [
  {
    title: 'CRM概览',
    path: '/crm/dashboard',
    icon: ChartBarIcon,
    userOnly: true,
  },
  {
    title: '客户单位',
    path: '/crm/companies',
    icon: BuildingOfficeIcon,
    userOnly: true,
  },
  {
    title: '商机管理',
    path: '/crm/opportunities',
    icon: BriefcaseIcon,
    userOnly: true,
  },
  {
    title: '合同管理',
    path: '/crm/contracts',
    icon: DocumentTextIcon,
    userOnly: true,
  },
];
