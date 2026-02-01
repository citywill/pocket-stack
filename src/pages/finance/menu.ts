import { BanknotesIcon } from '@heroicons/react/24/outline';

export const financeMenu = {
    title: '个人记账',
    icon: BanknotesIcon,
    children: [
        { title: '账单概览', path: '/finance' },
        { title: '记账记录', path: '/finance/records' },
    ],
};
