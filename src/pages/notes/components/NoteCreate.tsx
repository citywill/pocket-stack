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

            // 异步维护标签关联表
            if (data.tagIds.length > 0) {
                await Promise.all(data.tagIds.map(tagId =>
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
