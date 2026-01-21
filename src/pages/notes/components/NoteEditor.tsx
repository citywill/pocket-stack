import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    ImageAdd01Icon,
    Cancel01Icon,
    FileAttachmentIcon,
    Tag01Icon,
    Image01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TagInput } from './TagInput';

export interface NoteEditorData {
    content: string;
    files: File[];
    tagIds: string[];
    noted?: string;
    existingAttachments?: string[];
}

interface NoteEditorProps {
    initialData?: Partial<NoteEditorData>;
    getAttachmentUrl?: (filename: string) => string;
    onSubmit: (data: NoteEditorData) => Promise<void>;
    onCancel?: () => void;
    submitting?: boolean;
    placeholder?: string;
    submitLabel?: string;
    autoFocus?: boolean;
    showDate?: boolean;
    noCard?: boolean;
    className?: string;
}

export function NoteEditor({
    initialData,
    getAttachmentUrl,
    onSubmit,
    onCancel,
    submitting = false,
    placeholder = "分享你的想法...",
    submitLabel = "发布",
    autoFocus = true,
    showDate = false,
    noCard = false,
    className
}: NoteEditorProps) {
    const [content, setContent] = useState(initialData?.content || '');
    const [files, setFiles] = useState<File[]>(initialData?.files || []);
    const [tagIds, setTagIds] = useState<string[]>(initialData?.tagIds || []);
    const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
    const [noted, setNoted] = useState(initialData?.noted || new Date().toISOString().slice(0, 16));
    const [showTagInput, setShowTagInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 用于追踪是否已经从 initialData 初始化过一次
    const hasInitializedRef = useRef(false);

    // 当初始数据变化时更新状态（用于编辑模式）
    useEffect(() => {
        if (initialData && !hasInitializedRef.current) {
            if (initialData.content !== undefined) setContent(initialData.content);
            if (initialData.files !== undefined) setFiles(initialData.files);
            if (initialData.tagIds !== undefined) setTagIds(initialData.tagIds);
            if (initialData.existingAttachments !== undefined) {
                setExistingAttachments([...initialData.existingAttachments]);
            }
            if (initialData.noted !== undefined) {
                const date = new Date(initialData.noted);
                const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                setNoted(localDate);
            }
            hasInitializedRef.current = true;
        }
    }, [initialData]);

    const handleFormSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim() && files.length === 0 && existingAttachments.length === 0) return;

        await onSubmit({
            content,
            files,
            tagIds,
            noted: new Date(noted).toISOString(),
            existingAttachments
        });

        // 如果是发布成功后的清理逻辑由父组件决定，或者这里如果是“创建”模式可以清理
        if (!initialData?.content) {
            setContent('');
            setFiles([]);
            setTagIds([]);
            setExistingAttachments([]);
            setShowTagInput(false);
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

    const removeExistingAttachment = (filename: string) => {
        setExistingAttachments(prev => prev.filter(f => f !== filename));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleFormSubmit();
        } else if (e.key === 'Escape' && onCancel) {
            onCancel();
        }
    };

    const isImage = (filename: string) => {
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
    };

    const FormContent = (
        <form onSubmit={handleFormSubmit} className="flex-1">
            {showDate && (
                <div className="flex items-center gap-2 mb-3">
                    <input
                        type="datetime-local"
                        className="bg-slate-50 text-slate-600 rounded-xl px-3 py-1.5 text-xs border border-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={noted}
                        onChange={(e) => setNoted(e.target.value)}
                    />
                </div>
            )}
            <Textarea
                autoFocus={autoFocus}
                placeholder={placeholder}
                className="min-h-[100px] resize-none border-none focus-visible:ring-0 text-lg p-0 bg-transparent rounded-none placeholder:text-slate-300"
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

            {/* 附件展示 */}
            {(existingAttachments.length > 0 || files.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                    {/* 现有附件 */}
                    {existingAttachments.map((filename) => (
                        <div key={filename} className="relative group">
                            <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                {isImage(filename) && getAttachmentUrl ? (
                                    <img
                                        src={getAttachmentUrl(filename)}
                                        alt={filename}
                                        className="h-full w-full object-cover"
                                    />
                                ) : isImage(filename) ? (
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                        <HugeiconsIcon icon={Image01Icon} className="text-slate-400" />
                                    </div>
                                ) : (
                                    <HugeiconsIcon icon={FileAttachmentIcon} className="text-slate-400" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeExistingAttachment(filename);
                                }}
                                className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow-md border border-slate-100 p-1 hover:bg-slate-50 transition-colors z-20"
                                title="删除附件"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-slate-500" />
                            </button>
                        </div>
                    ))}

                    {/* 新选附件 */}
                    {files.map((file, index) => (
                        <div key={index} className="relative group">
                            <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-50 border border-blue-100 flex items-center justify-center">
                                {file.type.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <HugeiconsIcon icon={FileAttachmentIcon} className="text-blue-400" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow-md border border-slate-100 p-1 hover:bg-slate-50 transition-colors z-20"
                                title="删除附件"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-slate-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Separator className="bg-slate-100/50" />

            <div className="flex items-center justify-between pt-4">
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
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full px-4 text-slate-500 hover:text-slate-700"
                            onClick={onCancel}
                        >
                            取消
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={submitting || (!content.trim() && files.length === 0 && existingAttachments.length === 0)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-full font-medium transition-all hover:shadow-md disabled:opacity-50"
                    >
                        {submitting ? `${submitLabel}中...` : submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );

    if (noCard) {
        return (
            <div className={cn("flex gap-4", className)}>
                {FormContent}
            </div>
        );
    }

    return (
        <Card className={cn("p-4 rounded-2xl shadow-sm border-none bg-white transition-all duration-300 focus-within:shadow-md overflow-visible", className)}>
            <div className="flex gap-4">
                {FormContent}
            </div>
        </Card>
    );
}
