import { BanknotesIcon } from '@heroicons/react/24/outline';

export const menu = {
    title: '个人记账',
    icon: BanknotesIcon,
    userOnly: true,
    children: [
        { title: '账单概览', path: '/finance' },
        { title: '记账记录', path: '/finance/records' },
        { title: '分类管理', path: '/finance/categories' },
    ],
};
