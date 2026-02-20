export interface NotebookEntry {
  id: string;
  title: string;
  date: string;
  note_count: number;
  generated_count: number;
  chat_count: number;
  summary: string; // 保留摘要以便过滤搜索，虽然卡片不显示
}

export const mockNotebooks: NotebookEntry[] = [
  {
    id: 'nb-001',
    title: '关于某自然保护区非法捕捞风险研判',
    date: '2023-12-25 10:30',
    note_count: 12,
    generated_count: 5,
    chat_count: 28,
    summary: '针对近期监测到的某自然保护区非法捕捞活动，结合历史数据进行的综合风险分析。',
  },
  {
    id: 'nb-002',
    title: '青海湖周边生态环境专项巡回研判笔记',
    date: '2023-12-28 15:45',
    note_count: 8,
    generated_count: 3,
    chat_count: 15,
    summary: '对青海湖周边排污口排查情况的研判记录，重点关注季节性排放差异。',
  },
  {
    id: 'nb-003',
    title: '矿产资源开发违规风险点排查笔记',
    date: '2023-12-30 09:20',
    note_count: 15,
    generated_count: 8,
    chat_count: 42,
    summary: '结合卫星遥感影像对比，发现的几处疑似违规开采区域的初步研判。',
  },
  {
    id: 'nb-004',
    title: '草场退化治理成效法律监督研判',
    date: '2023-12-20 14:10',
    note_count: 6,
    generated_count: 4,
    chat_count: 12,
    summary: '对某县草场退化治理项目的资金使用及实际成效进行的法律监督分析。',
  },
  {
    id: 'nb-005',
    title: '生活垃圾违规倾倒线索智能筛选笔记',
    date: '2023-12-15 11:00',
    note_count: 24,
    generated_count: 12,
    chat_count: 86,
    summary: '利用AI模型对海量线索进行自动化分类后的复核研判记录。',
  },
  {
    id: 'nb-006',
    title: '大气污染联防联控区域协作研判',
    date: '2023-12-10 16:30',
    note_count: 4,
    generated_count: 2,
    chat_count: 9,
    summary: '针对跨区域大气污染治理中的法律协作机制进行的研判分析。',
  },
];
