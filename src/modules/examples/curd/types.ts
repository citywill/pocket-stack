export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
    id: string;
    title: string;
    content: string;
    status: PostStatus;
    category: string;
    author: string;
    created: string;
    updated: string;
}

export const STATUS_OPTIONS: { value: PostStatus; label: string; color: string }[] = [
    { value: 'draft', label: '草稿', color: 'bg-neutral-100 text-neutral-700' },
    { value: 'published', label: '已发布', color: 'bg-green-100 text-green-700' },
    { value: 'archived', label: '已归档', color: 'bg-orange-100 text-orange-700' },
];

export const CATEGORIES = ['技术', '生活', '工作', '其他'];
