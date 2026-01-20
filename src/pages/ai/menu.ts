import { AiChat02Icon, RobotIcon } from '@hugeicons/core-free-icons';

export const aiAssistantMenu = [
  {
    title: 'AI 对话',
    path: '/ai/playground',
    icon: AiChat02Icon,
    userOnly: true,
  },
  {
    title: '智能体管理',
    path: '/ai/agents',
    icon: RobotIcon,
    adminOnly: true,
  },
];
