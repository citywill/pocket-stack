import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    MapPinIcon,
    EllipsisVerticalIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    TrashIcon,
    PencilSquareIcon
} from "@heroicons/react/24/outline";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteItemProps {
    item: {
        id: string;
        title: string;
        type: string;
        content: string;
        isPinned: boolean;
    };
    isActive: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onToggleActive: (checked: boolean) => void;
    onTogglePin: (e: React.MouseEvent) => void;
    onEdit: (e: React.MouseEvent) => void;
    onRemove: (e: React.MouseEvent) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
    item,
    isActive,
    isSelected,
    onSelect,
    onToggleActive,
    onTogglePin,
    onEdit,
    onRemove
}) => {
    return (
        <Card
            className={`rounded-xl border-slate-100 hover:border-blue-200 transition-all duration-200 bg-slate-50/30 group p-2 cursor-pointer hover:bg-white relative flex flex-row items-center gap-2 h-[82px] ${isActive ? 'border-blue-500 bg-blue-50/30' : ''} ${item.isPinned ? 'border-blue-300 bg-blue-50/20' : ''} ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
            onClick={onSelect}
        >
            <div
                className="z-10 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <Checkbox
                    checked={isActive}
                    onCheckedChange={onToggleActive}
                    className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
            </div>
            <CardContent className="p-0 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {item.isPinned && (
                            <MapPinIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                        <h3 className="text-sm font-medium text-slate-800 truncate flex-1">{item.title}</h3>
                    </div>
                    <div className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded shrink-0">{item.type}</div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 truncate">
                    {item.content.replace(/<[^>]*>/g, '')}
                </p>
            </CardContent>
            <div className="transition-opacity" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                            <EllipsisVerticalIcon className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="gap-2" onClick={onEdit}>
                            <PencilSquareIcon className="w-4 h-4" />
                            <span>编辑</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={onTogglePin}>
                            {item.isPinned ? <ArrowDownIcon className="w-4 h-4" /> : <ArrowUpIcon className="w-4 h-4" />}
                            <span>{item.isPinned ? '取消置顶' : '置顶'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={onRemove}>
                            <TrashIcon className="w-4 h-4" />
                            <span>移除</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
};
