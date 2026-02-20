import { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { NoteEditor } from './NoteEditor';
import type { NoteEditorData } from './NoteEditor';

interface NoteCreateProps {
    onSuccess: () => void;
}

export function NoteCreate({ onSuccess }: NoteCreateProps) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (data: NoteEditorData) => {
        if (!user) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', data.content);
            formData.append('user', user.id);
            formData.append('noted', new Date().toISOString());

            for (const file of data.files) {
                formData.append('attachments', file);
            }

            const record = await pb.collection('notes').create(formData);

            // 处理标签：先创建临时标签，再建立链接
            let finalTagIds = [...data.tagIds];

            // 1. 处理临时标签
            if (data.tempTags && data.tempTags.length > 0) {
                const tempTagMap: Record<string, string> = {};

                await Promise.all(data.tempTags.map(async (tempTag) => {
                    try {
                        // 检查是否在创建过程中已经有同名标签被创建了（并发情况）
                        const existing = await pb.collection('note_tags').getFirstListItem(`name="${tempTag.name}" && user="${user.id}"`).catch(() => null);

                        let tagRecord;
                        if (existing) {
                            tagRecord = existing;
                        } else {
                            tagRecord = await pb.collection('note_tags').create({
                                name: tempTag.name,
                                user: user.id
                            });
                        }
                        tempTagMap[tempTag.id] = tagRecord.id;
                    } catch (err) {
                        console.error('Failed to create temp tag:', tempTag.name, err);
                    }
                }));

                // 将 tagIds 中的临时 ID 替换为真实 ID
                finalTagIds = finalTagIds.map(id => tempTagMap[id] || id);
            }

            // 2. 异步维护标签关联表
            if (finalTagIds.length > 0) {
                // 过滤掉仍然是 temp_ 开头的 ID（创建失败的情况）
                const validTagIds = finalTagIds.filter(id => !id.startsWith('temp_'));

                await Promise.all(validTagIds.map(tagId =>
                    pb.collection('note_tag_links').create({
                        note: record.id,
                        tag: tagId
                    }, { requestKey: null })
                ));
            }

            toast.success('发布成功');
            onSuccess();
        } catch (error: any) {
            if (!error.isAbort) {
                console.error('Failed to create note:', error);
                toast.error('发布失败');
            }
            throw error; // 抛出错误以便 NoteEditor 知道提交失败，不重置状态
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <NoteEditor
            onSubmit={handleSubmit}
            submitting={submitting}
        />
    );
}
