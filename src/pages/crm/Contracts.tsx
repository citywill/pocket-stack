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
import { ContractForm } from './components/ContractForm';
import { ContractFilters } from './components/ContractFilters';

export default function Contracts() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | undefined>();

    // Pagination state
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchContracts = async () => {
        try {
            setLoading(true);

            let filters = [];
            if (search) {
                filters.push(`(name ~ "${search}" || code ~ "${search}" || company.name ~ "${search}")`);
            }
            if (filterStatus !== 'all') {
                filters.push(`status = "${filterStatus}"`);
            }

            const filterString = filters.join(' && ');

            const result = await pb.collection('crm_contracts').getList(page, perPage, {
                sort: '-created',
                filter: filterString,
                expand: 'company,opportunity',
            });
            setContracts(result.items);
            setTotalItems(result.totalItems);
        } catch (error: any) {
            if (error?.isAbort) return;
            console.error('Fetch error:', error);
            toast.error('获取合同列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchContracts();
        }, 300);
        return () => clearTimeout(handler);
    }, [page, search, filterStatus]);

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个合同吗？')) return;
        try {
            await pb.collection('crm_contracts').delete(id);
            toast.success('删除成功');
            fetchContracts();
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            '待签订': 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-none rounded-lg',
            '执行中': 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-none rounded-lg',
            '已完成': 'bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-lg',
            '已终止': 'bg-red-100 text-red-700 hover:bg-red-100 border-none rounded-lg',
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
                        合同管理
                    </h1>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        管理客户合同，跟踪执行进度和回款。
                    </p>
                </div>
                <Button onClick={() => { setEditingId(undefined); setFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 rounded-2xl">
                    <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                    新增合同
                </Button>
            </div>

            {/* 筛选栏 */}
            <ContractFilters
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
                                    <TableHead className="font-semibold">合同名称/编号</TableHead>
                                    <TableHead className="font-semibold">客户单位</TableHead>
                                    <TableHead className="font-semibold">关联商机</TableHead>
                                    <TableHead className="font-semibold">合同金额</TableHead>
                                    <TableHead className="font-semibold">当前状态</TableHead>
                                    <TableHead className="font-semibold">签订日期</TableHead>
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
                                ) : contracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-neutral-500">
                                            暂无合同数据
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    contracts.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors border-neutral-100 dark:border-neutral-800">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-xs text-neutral-400">{item.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-neutral-500">
                                                    {item.expand?.company?.name || '未知单位'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-neutral-500 italic">
                                                    {item.expand?.opportunity?.name || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-blue-600">
                                                    ¥{item.amount?.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                                            <TableCell className="text-neutral-400 text-sm">
                                                {item.sign_date ? item.sign_date.split(' ')[0] : '-'}
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

            <ContractForm
                open={formOpen}
                onOpenChange={setFormOpen}
                contractId={editingId}
                onSuccess={() => fetchContracts()}
            />
        </div>
    );
}
