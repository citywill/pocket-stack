import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';

interface ContractFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    status: string;
    onStatusChange: (value: string) => void;
    onReset: () => void;
}

export function ContractFilters({
    search,
    onSearchChange,
    status,
    onStatusChange,
    onReset,
}: ContractFiltersProps) {
    return (
        <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50 p-0">
            <CardContent className="p-3">
                <div className="flex flex-wrap items-center gap-4">
                    {/* 搜索框 */}
                    <div className="relative min-w-[240px] flex-1">
                        <HugeiconsIcon
                            icon={Search01Icon}
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                        />
                        <Input
                            placeholder="搜索合同名称、编号、客户单位..."
                            className="pl-10 rounded-xl border-neutral-200 focus:ring-blue-500 bg-white/50"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* 筛选条件组 */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-500 min-w-max">合同状态:</span>
                            <Select value={status} onValueChange={onStatusChange}>
                                <SelectTrigger className="w-[110px] rounded-xl border-neutral-200 bg-white/50">
                                    <SelectValue placeholder="全部" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="待签订">待签订</SelectItem>
                                    <SelectItem value="执行中">执行中</SelectItem>
                                    <SelectItem value="已完成">已完成</SelectItem>
                                    <SelectItem value="已终止">已终止</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-neutral-500 hover:text-blue-600 px-2"
                            onClick={onReset}
                        >
                            重置
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
