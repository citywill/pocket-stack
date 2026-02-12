import { ChatBubbleLeftRightIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export const menu = [
  {
    title: 'AI 对话',
    path: '/ai/playground',
    icon: ChatBubbleLeftRightIcon,
    userOnly: true,
  },
  {
    title: '智能体管理',
    path: '/ai/agents',
    icon: CpuChipIcon,
    adminOnly: true,
  },
];
