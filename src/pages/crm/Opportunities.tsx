import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PlusSignIcon,
    PencilEdit01Icon,
    Delete01Icon,
    ArrowLeft01Icon,
    ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { OpportunityForm } from './components/OpportunityForm';
import { OpportunityFilters } from './components/OpportunityFilters';

export default function Opportunities() {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | undefined>();

    // Pagination state
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);

            let filters = [];
            if (search) {
                filters.push(`(name ~ "${search}" || company.name ~ "${search}")`);
            }
            if (filterStatus !== 'all') {
                filters.push(`status = "${filterStatus}"`);
            }

            const filterString = filters.join(' && ');

            const result = await pb.collection('crm_opportunities').getList(page, perPage, {
                sort: '-created',
                filter: filterString,
                expand: 'company',
            });
            setOpportunities(result.items);
            setTotalItems(result.totalItems);
        } catch (error: any) {
            if (error?.isAbort) return;
            console.error('Fetch error:', error);
            toast.error('获取商机列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchOpportunities();
        }, 300);
        return () => clearTimeout(handler);
    }, [page, search, filterStatus]);

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个商机吗？')) return;
        try {
            await pb.collection('crm_opportunities').delete(id);
            toast.success('删除成功');
            fetchOpportunities();
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            '初步接触': 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-none rounded-lg',
            '需求分析': 'bg-purple-100 text-purple-700 hover:bg-purple-100 border-none rounded-lg',
            '方案报价': 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-none rounded-lg',
            '合同签订': 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-none rounded-lg',
            '赢单关闭': 'bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-lg',
            '输单关闭': 'bg-red-100 text-red-700 hover:bg-red-100 border-none rounded-lg',
        };
        return (
            <Badge className={styles[status] || ''}>
                {status}
            </Badge>
        );
    };

    const totalPages = Math.ceil(totalItems / perPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                        商机管理
                    </h1>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        管理和跟进销售商机，提升转化率。
                    </p>
                </div>
                <Button onClick={() => { setEditingId(undefined); setFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 rounded-2xl">
                    <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                    新增商机
                </Button>
            </div>

            {/* 筛选栏 */}
            <OpportunityFilters
                search={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                }}
                status={filterStatus}
                onStatusChange={(val) => {
                    setFilterStatus(val);
                    setPage(1);
                }}
                onReset={() => {
                    setSearch('');
                    setFilterStatus('all');
                    setPage(1);
                }}
            />

            {/* 数据表格 */}
            <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50 p-0">
                <CardContent className="p-0">
                    <div className="rounded-t-2xl border-x border-t border-neutral-100 dark:border-neutral-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                                <TableRow>
                                    <TableHead className="font-semibold">商机名称</TableHead>
                                    <TableHead className="font-semibold">客户单位</TableHead>
                                    <TableHead className="font-semibold">预计金额</TableHead>
                                    <TableHead className="font-semibold">赢单概率</TableHead>
                                    <TableHead className="font-semibold">当前状态</TableHead>
                                    <TableHead className="font-semibold">预计结单</TableHead>
                                    <TableHead className="text-right font-semibold">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-neutral-500">
                                            加载中...
                                        </TableCell>
                                    </TableRow>
                                ) : opportunities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-neutral-500">
                                            暂无商机数据
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    opportunities.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors border-neutral-100 dark:border-neutral-800">
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                <div className="text-neutral-500">
                                                    {item.expand?.company?.name || '未知单位'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-blue-600">
                                                    ¥{item.amount?.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${item.probability}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-neutral-400">{item.probability}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                                            <TableCell className="text-neutral-400 text-sm">
                                                {item.expected_close_date ? item.expected_close_date.split(' ')[0] : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-500 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => { setEditingId(item.id); setFormOpen(true); }}
                                                    >
                                                        <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* 分页栏 */}
                    <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-b-2xl bg-white/30 flex items-center justify-between">
                        <div className="text-sm text-neutral-500">
                            共 {totalItems} 条数据，第 {page} / {totalPages || 1} 页
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-neutral-200"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                            >
                                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4 mr-1" />
                                上一页
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-neutral-200"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                            >
                                下一页
                                <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <OpportunityForm
                open={formOpen}
                onOpenChange={setFormOpen}
                opportunityId={editingId}
                onSuccess={fetchOpportunities}
            />
        </div>
    );
}
