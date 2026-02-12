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
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface OpportunityFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    status: string;
    onStatusChange: (value: string) => void;
    onReset: () => void;
}

export function OpportunityFilters({
    search,
    onSearchChange,
    status,
    onStatusChange,
    onReset,
}: OpportunityFiltersProps) {
    return (
        <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50 p-0">
            <CardContent className="p-3">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative min-w-[240px] flex-1">
                        <MagnifyingGlassIcon
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                        />
                        <Input
                            placeholder="搜索商机名称或客户单位..."
                            className="pl-10 rounded-xl border-neutral-200 focus:ring-blue-500 bg-white/50"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500 min-w-max">商机状态:</span>
                        <Select value={status} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-[130px] rounded-xl border-neutral-200 bg-white/50">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">全部</SelectItem>
                                {['初步接触', '需求分析', '方案报价', '合同签订', '赢单关闭', '输单关闭'].map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
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
            </CardContent>
        </Card>
    );
}
