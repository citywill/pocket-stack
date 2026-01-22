import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book01Icon } from "@hugeicons/core-free-icons";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteContentProps {
    item: {
        id: string;
        title: string;
        type: string;
        content: string;
    };
    isActive: boolean;
    onToggleActive: (checked: boolean) => void;
}

export const NoteContent: React.FC<NoteContentProps> = ({
    item,
    isActive,
    onToggleActive
}) => {
    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-6 space-y-6">
                <div className="space-y-2 relative">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                            {item.type}
                        </span>
                        <span className="text-[10px] text-slate-400">研判笔记关联知识</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight flex-1">
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0 pt-1">
                            <span className="text-xs text-slate-500 font-medium">激活知识</span>
                            <Checkbox
                                checked={isActive}
                                onCheckedChange={onToggleActive}
                                className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.content}
                    </ReactMarkdown>
                </div>

            </div>
        </div>
    );
};
