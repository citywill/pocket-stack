export interface KanbanTag {
    id: string;
    name: string;
    color?: string;
    user: string;
    created: string;
    updated: string;
}

export type KanbanTaskStatus = 'todo' | 'in_progress' | 'done';
export type KanbanTaskPriority = 'low' | 'medium' | 'high';

export interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    status: KanbanTaskStatus;
    priority: KanbanTaskPriority;
    tags: string[]; // 关联的标签 ID
    is_archived: boolean;
    expand?: {
        tags?: KanbanTag[];
    };
    user: string;
    order: number;
    created: string;
    updated: string;
}

export interface KanbanLog {
    id: string;
    task: string;
    content: string;
    remark?: string;
    user: string;
    created: string;
    updated: string;
    expand?: {
        task?: KanbanTask;
    };
}
