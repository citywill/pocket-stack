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
    SmileIcon,
    Calendar01Icon,
    Cancel01Icon,
    FileAttachmentIcon
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

interface NoteFormProps {
    onSuccess: () => void;
}

export function NoteForm({ onSuccess }: NoteFormProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!content.trim() && files.length === 0) || !user) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('user', user.id);

            for (const file of files) {
                formData.append('attachments', file);
            }

            await pb.collection('notes').create(formData);

            setContent('');
            setFiles([]);
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
        <Card className="p-4 mb-6 rounded-2xl shadow-sm border border-transparent bg-card/50 backdrop-blur transition-all duration-300 focus-within:border-blue-500/30 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:bg-card">
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

                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {files.map((file, index) => (
                                <div key={index} className="relative group bg-muted/50 rounded-lg p-2 flex items-center gap-2 border border-blue-500/10">
                                    <HugeiconsIcon icon={FileAttachmentIcon} size={16} className="text-blue-500" />
                                    <span className="text-xs max-w-[100px] truncate">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Separator className="my-3 opacity-50" />
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2 text-primary">
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <HugeiconsIcon icon={ImageAdd01Icon} size={20} />
                            </Button>
                        </div>
                        <Button
                            disabled={(!content.trim() && files.length === 0) || submitting}
                            className="rounded-full px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold"
                        >
                            {submitting ? '发布中...' : '发布'}
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}
