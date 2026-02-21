export interface FinanceCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  created: string;
  updated: string;
}

export interface FinanceRecord {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  expand?: {
    category: FinanceCategory;
  };
  date: string;
  note: string;
  user: string;
  created: string;
  updated: string;
}

export const RECORD_TYPE_OPTIONS = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' },
];
