import { AiChat02Icon } from '@hugeicons/core-free-icons';

export const aiAssistantMenu = {
  title: 'AI 助手',
  icon: AiChat02Icon,
  children: [
    { title: 'AI 对话', path: '/ai-playground' },
    { title: '数据助手', path: '/ai-assistant' },
    { title: '智能体管理', path: '/ai-agents', adminOnly: true },
  ],
};
