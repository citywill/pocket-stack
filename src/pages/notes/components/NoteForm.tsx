import React, { useState, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    ImageAdd01Icon,
    Cancel01Icon,
    FileAttachmentIcon,
    Tag01Icon
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TagInput } from './TagInput';

interface NoteFormProps {
    onSuccess: () => void;
}

export function NoteForm({ onSuccess }: NoteFormProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [showTagInput, setShowTagInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!content.trim() && files.length === 0) || !user) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('user', user.id);
            formData.append('noted', new Date().toISOString());

            for (const file of files) {
                formData.append('attachments', file);
            }

            const record = await pb.collection('notes').create(formData);

            // 异步维护标签关联表
            if (tagIds.length > 0) {
                await Promise.all(tagIds.map(tagId =>
                    pb.collection('note_tag_links').create({
                        note: record.id,
                        tag: tagId
                    }, { requestKey: null })
                ));
            }

            setContent('');
            setFiles([]);
            setTagIds([]);
            toast.success('发布成功');
            onSuccess();
        } catch (error: any) {
            if (!error.isAbort) {
                console.error('Failed to create note:', error);
                toast.error('发布失败');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const getAvatarUrl = (record: any) => {
        if (!record || !record.avatar) return '';
        return pb.files.getURL(record, record.avatar);
    };

    return (
        <Card className="p-4 rounded-2xl shadow-sm border-none bg-white transition-all duration-300 focus-within:shadow-md overflow-visible">
            <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(user)} />
                    <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <form onSubmit={handleSubmit} className="flex-1">
                    <Textarea
                        autoFocus
                        placeholder="分享你的想法..."
                        className="min-h-[100px] resize-none border-none focus-visible:ring-0 text-lg p-0 bg-transparent rounded-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <div className="py-2">
                        <TagInput
                            selectedTagIds={tagIds}
                            onChange={setTagIds}
                            showAddControl={showTagInput}
                        />
                    </div>

                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {files.map((file, index) => (
                                <div key={index} className="relative group">
                                    <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <HugeiconsIcon icon={FileAttachmentIcon} className="text-slate-400" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm border border-slate-100 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} size={12} className="text-slate-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Separator className="bg-slate-100/50" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <HugeiconsIcon icon={ImageAdd01Icon} size={20} />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-xl transition-all duration-200",
                                    showTagInput
                                        ? "text-blue-600 bg-blue-50"
                                        : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                )}
                                onClick={() => setShowTagInput(!showTagInput)}
                                title="编辑标签"
                            >
                                <HugeiconsIcon icon={Tag01Icon} size={20} />
                            </Button>
                        </div>
                        <Button
                            type="submit"
                            disabled={submitting || (!content.trim() && files.length === 0)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-full font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {submitting ? '发布中...' : '发布'}
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}
