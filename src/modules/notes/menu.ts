import { PencilSquareIcon, TagIcon } from '@heroicons/react/24/outline';

export const menu = [
    {
        title: '笔记',
        icon: PencilSquareIcon,
        path: '/',
        userOnly: true
    },
    {
        title: '标签管理',
        icon: TagIcon,
        path: '/tags',
        userOnly: true
    }
];
