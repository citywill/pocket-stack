import React, { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { pb } from '@/lib/pocketbase';
import { toast } from "sonner";

interface EditNoteDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    note: {
        id: string;
        title: string;
        type: string;
        content: string;
    } | null;
    onSuccess: () => void;
}

export const EditNoteDialog: React.FC<EditNoteDialogProps> = ({
    isOpen,
    onOpenChange,
    note,
    onSuccess
}) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('其它知识');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    // 当传入的 note 改变时，更新表单状态
    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            setType(note.type || '其它知识');
            setContent(note.content || '');
        }
    }, [note, isOpen]);

    const editorOptions = useMemo(() => ({
        spellChecker: false,
        placeholder: "输入笔记内容...",
        autofocus: true,
        status: false,
        minHeight: "300px",
        maxHeight: "500px",
    }), []);

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!note) return;
        if (!title.trim()) {
            toast.error("请输入标题");
            return;
        }
        if (!content.trim()) {
            toast.error("请输入内容");
            return;
        }

        try {
            setLoading(true);
            
            await pb.collection('notebook_notes').update(note.id, {
                title: title,
                content: content,
                type: type,
            });

            toast.success("笔记更新成功");
            onSuccess();
            handleClose();
        } catch (error) {
            console.error("更新笔记失败:", error);
            toast.error("更新笔记失败，请稍后重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">编辑研判笔记</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">标题</Label>
                        <Input
                            id="title"
                            placeholder="输入笔记标题..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl border-slate-200 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">类型</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                                <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="法律法规">法律法规</SelectItem>
                                <SelectItem value="研判分析">研判分析</SelectItem>
                                <SelectItem value="案源信息">案源信息</SelectItem>
                                <SelectItem value="巡回记录">巡回记录</SelectItem>
                                <SelectItem value="其它知识">其它知识</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">正文内容 (Markdown)</Label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden min-h-[300px]">
                            <SimpleMDE
                                value={content}
                                onChange={(value) => setContent(value)}
                                options={editorOptions}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t bg-slate-50/50">
                    <Button variant="outline" onClick={handleClose} className="rounded-xl">
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8"
                    >
                        {loading ? '保存中...' : '保存修改'}
                    </Button>
                </DialogFooter>
            </DialogContent>

            <style dangerouslySetInnerHTML={{
                __html: `
                .editor-toolbar {
                    border-top: none !important;
                    border-left: none !important;
                    border-right: none !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    background: #f8fafc !important;
                    padding: 4px 8px !important;
                }
                .CodeMirror {
                    border: none !important;
                    font-family: inherit !important;
                    font-size: 14px !important;
                }
                .editor-preview {
                    background: white !important;
                }
            `}} />
        </Dialog>
    );
};
