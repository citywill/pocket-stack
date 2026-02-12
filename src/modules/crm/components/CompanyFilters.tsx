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

interface CompanyFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    type: string;
    onTypeChange: (value: string) => void;
    level: string;
    onLevelChange: (value: string) => void;
    status: string;
    onStatusChange: (value: string) => void;
    onReset: () => void;
}

export function CompanyFilters({
    search,
    onSearchChange,
    type,
    onTypeChange,
    level,
    onLevelChange,
    status,
    onStatusChange,
    onReset,
}: CompanyFiltersProps) {
    return (
        <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50 p-0">
            <CardContent className="p-3">
                <div className="flex flex-wrap items-center gap-4">
                    {/* 搜索框 */}
                    <div className="relative min-w-[240px] flex-1">
                        <MagnifyingGlassIcon
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                        />
                        <Input
                            placeholder="搜索单位名称、联系人、电话..."
                            className="pl-10 rounded-xl border-neutral-200 focus:ring-blue-500 bg-white/50"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* 筛选条件组 */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-500 min-w-max">单位类型:</span>
                            <Select value={type} onValueChange={onTypeChange}>
                                <SelectTrigger className="w-[130px] rounded-xl border-neutral-200 bg-white/50">
                                    <SelectValue placeholder="全部" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="企业">企业</SelectItem>
                                    <SelectItem value="政府机构">政府机构</SelectItem>
                                    <SelectItem value="个人">个人</SelectItem>
                                    <SelectItem value="其他">其他</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-500 min-w-max">客户等级:</span>
                            <Select value={level} onValueChange={onLevelChange}>
                                <SelectTrigger className="w-[110px] rounded-xl border-neutral-200 bg-white/50">
                                    <SelectValue placeholder="全部" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="核心">核心</SelectItem>
                                    <SelectItem value="重要">重要</SelectItem>
                                    <SelectItem value="普通">普通</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-500 min-w-max">业务状态:</span>
                            <Select value={status} onValueChange={onStatusChange}>
                                <SelectTrigger className="w-[110px] rounded-xl border-neutral-200 bg-white/50">
                                    <SelectValue placeholder="全部" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="活跃">活跃</SelectItem>
                                    <SelectItem value="流失">流失</SelectItem>
                                    <SelectItem value="潜客">潜客</SelectItem>
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
