export type OkrStatus = '未开始' | '进行中' | '已完成';
export type TaskStatus = '待开始' | '进行中' | '已完成';
export type TaskPriority = '高' | '中' | '低';

export interface Okr {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: OkrStatus;
  user: string;
  created: string;
  updated: string;
}

export interface Objective {
  id: string;
  name: string;
  okr: string; // 后端虽为多选，但业务上是一对一，PB会自动处理单个ID
  user: string;
  created: string;
  updated: string;
}

export interface Kr {
  id: string;
  name: string;
  okr: string;
  objectives: string[];
  target_value: number;
  current_value: number;
  unit: string;
  user: string;
  created: string;
  updated: string;
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  okr: string;
  kr: string; // 后端虽为多选，但业务上是一对一，PB会自动处理单个ID
  notes: string;
  user: string;
  created: string;
  updated: string;
}

export const OKR_STATUS_OPTIONS: OkrStatus[] = ['未开始', '进行中', '已完成'];
export const TASK_STATUS_OPTIONS: TaskStatus[] = ['待开始', '进行中', '已完成'];
export const TASK_PRIORITY_OPTIONS: TaskPriority[] = ['高', '中', '低'];
