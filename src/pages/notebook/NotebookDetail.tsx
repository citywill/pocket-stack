import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    Book01Icon,
    ArtificialIntelligence01Icon,
    MoreVerticalIcon,
    Calendar01Icon,
    Share01Icon,
    Download01Icon,
    Add01Icon,
    ArrowLeft02Icon,
    SidebarLeftIcon,
    SidebarRightIcon,
} from "@hugeicons/core-free-icons";
import { pb } from '@/lib/pocketbase';
import type { NotebookEntry } from './mocks/notebookMocks';
import { ClientResponseError } from 'pocketbase';
import { NoteItem } from './components/NoteItem';
import { NoteContent } from './components/NoteContent';
import { CreateNoteDialog } from './components/CreateNoteDialog';
import { AiChatContainer } from './components/AiChatContainer';
import { Artifact } from './components/Artifact';

interface NotebookBuilder {
    id: string;
    title: string;
    icon: string;
    prompt: string;
    type: 'mindmap' | 'text' | 'table';
}

export default function NotebookDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [notebook, setNotebook] = useState<NotebookEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNoteIndex, setSelectedNoteIndex] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
    const [isResultsCollapsed, setIsResultsCollapsed] = useState(false);

    // 获取笔记本详情
    const fetchNotebook = async (silent = false) => {
        if (!id) return;
        try {
            if (!silent) setLoading(true);
            const record = await pb.collection('notebooks').getOne(id, {
                requestKey: null, // 禁用自动取消，确保在 React 18 StrictMode 下也能成功获取数据
            });
            const mapped: NotebookEntry = {
                id: record.id,
                title: record.title,
                date: record.created.replace('T', ' ').slice(0, 16),
                note_count: record.note_count || 0,
                generated_count: record.generated_count || 0,
                chat_count: record.chat_count || 0,
                summary: record.summary || "",
            };
            setNotebook(mapped);
        } catch (error) {
            if (error instanceof ClientResponseError && error.isAbort) {
                // 如果是请求被取消，则不作为错误处理
                return;
            }
            console.error("获取笔记本详情失败:", error);
            if (!silent) setNotebook(null);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotebook();
    }, [id]);

    // 笔记列表数据
    const [noteItems, setNoteItems] = useState<{ id: string, title: string, type: string, content: string, isPinned: boolean, isActive: boolean }[]>([]);

    // 获取笔记本关联笔记识点
    const fetchNotes = async () => {
        if (!id) return;
        try {
            const records = await pb.collection('notebook_notes').getFullList({
                filter: `notebook_id = "${id}"`,
                sort: '-created',
                requestKey: null,
            });

            const mappedNotes = records.map(record => ({
                id: record.id,
                title: record.title,
                type: record.type || '未分类',
                content: record.content,
                isPinned: record.is_pinned || false,
                isActive: record.is_active || false
            }));

            setNoteItems(mappedNotes);
        } catch (error) {
            if (error instanceof ClientResponseError && error.isAbort) return;
            console.error("获取笔记失败:", error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchNotes();
        }
    }, [id]);

    // 获取排序后的列表：置顶的在前
    const sortedNoteItems = [...noteItems].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    const togglePin = async (noteId: string) => {
        const item = noteItems.find(i => i.id === noteId);
        if (!item) return;

        try {
            const newPinnedState = !item.isPinned;
            await pb.collection('notebook_notes').update(noteId, {
                is_pinned: newPinnedState
            });
            setNoteItems(prev => prev.map(i =>
                i.id === noteId ? { ...i, isPinned: newPinnedState } : i
            ));
        } catch (error) {
            console.error("更新置顶状态失败:", error);
        }
    };

    const toggleActive = async (noteId: string, checked: boolean) => {
        try {
            await pb.collection('notebook_notes').update(noteId, {
                is_active: checked
            });
            setNoteItems(prev => prev.map(i =>
                i.id === noteId ? { ...i, isActive: checked } : i
            ));
        } catch (error) {
            console.error("更新激活状态失败:", error);
        }
    };

    const removeItem = async (noteId: string) => {
        try {
            await pb.collection('notebook_notes').delete(noteId);
            setNoteItems(prev => prev.filter(item => item.id !== noteId));
            if (selectedNoteIndex === noteId) {
                setSelectedNoteIndex(null);
            }
        } catch (error) {
            console.error("删除笔记失败:", error);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500">加载中...</p>
            </div>
        );
    }

    if (!notebook) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
                <p className="text-slate-500 mb-4 text-lg">未找到该研判笔记</p>
                <Button onClick={() => navigate('/notebook')}>返回列表</Button>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* 顶栏 */}
            <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-slate-100"
                        onClick={() => navigate('/notebook')}
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{notebook.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <HugeiconsIcon icon={Calendar01Icon} className="w-3 h-3" />
                            <span>创建于 {notebook.date}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9">
                        <HugeiconsIcon icon={Share01Icon} className="w-4 h-4" />
                        分享
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9">
                        <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
                        导出报告
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                        <HugeiconsIcon icon={MoreVerticalIcon} className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* 三栏内容区 */}
            <main className="flex-1 flex overflow-hidden p-4 gap-4">
                {/* 第一列：笔记栏 */}
                <section className={`${isNotesCollapsed ? 'w-12 min-w-[48px] flex-none' : 'flex-1 min-w-[320px]'} flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 relative`}>
                    <div className={`p-4 border-b flex items-center ${isNotesCollapsed ? 'justify-center px-0' : 'justify-between'} bg-slate-50/50 shrink-0`}>
                        {!isNotesCollapsed && (
                            <div className="flex items-center gap-2 text-slate-600 overflow-hidden whitespace-nowrap">
                                {selectedNoteIndex !== null ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -ml-1 rounded-lg hover:bg-slate-200"
                                        onClick={() => setSelectedNoteIndex(null)}
                                    >
                                        <HugeiconsIcon icon={ArrowLeft02Icon} className="w-5 h-5" />
                                    </Button>
                                ) : (
                                    <HugeiconsIcon icon={Book01Icon} className="w-5 h-5" />
                                )}
                                <h2 className="font-bold">
                                    {selectedNoteIndex !== null ? '笔记详情' : `相关笔记 (${noteItems.length})`}
                                </h2>
                            </div>
                        )}
                        <div className={`flex items-center gap-1 ${isNotesCollapsed ? 'flex-col' : ''}`}>
                            {!isNotesCollapsed && selectedNoteIndex === null && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                                    onClick={() => setIsCreateDialogOpen(true)}
                                    title="添加笔记"
                                >
                                    <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                                onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                                title={isNotesCollapsed ? "展开笔记" : "折叠笔记"}
                            >
                                <HugeiconsIcon icon={isNotesCollapsed ? SidebarRightIcon : SidebarLeftIcon} className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {!isNotesCollapsed && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                            {selectedNoteIndex === null ? (
                                <div className="p-4 space-y-3">
                                    {/* 笔记列表 */}
                                    {sortedNoteItems.map((item) => (
                                        <NoteItem
                                            key={item.id}
                                            item={item}
                                            isActive={item.isActive}
                                            isSelected={selectedNoteIndex === item.id}
                                            onSelect={() => setSelectedNoteIndex(item.id)}
                                            onToggleActive={(checked) => toggleActive(item.id, checked)}
                                            onTogglePin={(e) => {
                                                e.stopPropagation();
                                                togglePin(item.id);
                                            }}
                                            onRemove={(e) => {
                                                e.stopPropagation();
                                                removeItem(item.id);
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <NoteContent
                                    item={noteItems.find(i => i.id === selectedNoteIndex)!}
                                    isActive={noteItems.find(i => i.id === selectedNoteIndex)?.isActive || false}
                                    onToggleActive={(checked) => toggleActive(selectedNoteIndex!, checked)}
                                />
                            )}
                        </div>
                    )}
                </section>

                {/* 第二列：对话栏 */}
                <AiChatContainer
                    notebookId={id!}
                    notebookTitle={notebook.title}
                    chatCount={notebook.chat_count}
                    onChatUpdate={() => fetchNotebook(true)}
                    onNoteCreated={() => fetchNotes()}
                />

                {/* 第三列：生成栏 */}
                <section className={`${isResultsCollapsed ? 'w-12 min-w-[48px] flex-none' : 'flex-1 min-w-[320px]'} flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 relative`}>
                    <div className={`p-4 border-b flex items-center ${isResultsCollapsed ? 'justify-center px-0' : 'justify-between'} bg-slate-50/50 shrink-0`}>
                        {!isResultsCollapsed && (
                            <div className="flex items-center gap-2 text-slate-600 overflow-hidden whitespace-nowrap">
                                <HugeiconsIcon icon={ArtificialIntelligence01Icon} className="w-5 h-5" />
                                <h2 className="font-bold">生成作品 ({notebook.generated_count})</h2>
                            </div>
                        )}
                        <div className={`flex items-center gap-1 ${isResultsCollapsed ? 'flex-col' : ''}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                                onClick={() => setIsResultsCollapsed(!isResultsCollapsed)}
                                title={isResultsCollapsed ? "展开成果" : "折叠成果"}
                            >
                                <HugeiconsIcon icon={isResultsCollapsed ? SidebarLeftIcon : SidebarRightIcon} className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    {!isResultsCollapsed && (
                        <Artifact
                            notebookId={id!}
                            activeNotes={noteItems.filter(n => n.isActive)}
                            onArtifactUpdate={() => fetchNotebook(true)}
                        />
                    )}
                </section>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />

            <CreateNoteDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                notebookId={id!}
                onSuccess={fetchNotes}
            />
        </div>
    );
}
