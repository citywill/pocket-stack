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
import { CompanyForm } from './components/CompanyForm';
import { CompanyFilters } from './components/CompanyFilters';

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      let filters = [];
      if (search) {
        filters.push(`(name ~ "${search}" || contact_person ~ "${search}" || contact_phone ~ "${search}")`);
      }
      if (filterType !== 'all') {
        filters.push(`type = "${filterType}"`);
      }
      if (filterLevel !== 'all') {
        filters.push(`level = "${filterLevel}"`);
      }
      if (filterStatus !== 'all') {
        filters.push(`status = "${filterStatus}"`);
      }

      const filterString = filters.join(' && ');

      const result = await pb.collection('crm_companies').getList(page, perPage, {
        sort: '-created',
        filter: filterString,
      });
      setCompanies(result.items);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      console.error('Fetch error:', error);
      // Only show error toast if it's not a cancellation error
      if (error?.isAbort) return;
      toast.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCompanies();
    }, 300); // 300ms 防抖

    return () => clearTimeout(handler);
  }, [page, search, filterType, filterLevel, filterStatus]);

  const totalPages = Math.ceil(totalItems / perPage);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个客户单位吗？')) return;
    try {
      await pb.collection('crm_companies').delete(id);
      toast.success('删除成功');
      fetchCompanies();
    } catch (error: any) {
      toast.error('删除失败');
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingId(undefined);
    setFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '活跃':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-lg">活跃</Badge>;
      case '潜客':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none rounded-lg">潜客</Badge>;
      case '流失':
        return <Badge className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100 border-none rounded-lg">流失</Badge>;
      default:
        return <Badge variant="outline" className="rounded-lg">{status}</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case '核心':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none rounded-lg">核心</Badge>;
      case '重要':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none rounded-lg">重要</Badge>;
      case '普通':
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none rounded-lg">普通</Badge>;
      default:
        return <Badge variant="outline" className="rounded-lg">{level}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    return type || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            客户单位管理
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            管理 CRM 系统中的所有客户单位信息。
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 rounded-2xl">
          <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
          新增单位
        </Button>
      </div>

      {/* 筛选栏 */}
      <CompanyFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        type={filterType}
        onTypeChange={(val) => {
          setFilterType(val);
          setPage(1);
        }}
        level={filterLevel}
        onLevelChange={(val) => {
          setFilterLevel(val);
          setPage(1);
        }}
        status={filterStatus}
        onStatusChange={(val) => {
          setFilterStatus(val);
          setPage(1);
        }}
        onReset={() => {
          setSearch('');
          setFilterType('all');
          setFilterLevel('all');
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
                  <TableHead className="font-semibold">单位名称</TableHead>
                  <TableHead className="font-semibold">联系人</TableHead>
                  <TableHead className="font-semibold">行业</TableHead>
                  <TableHead className="font-semibold">等级</TableHead>
                  <TableHead className="font-semibold">状态</TableHead>
                  <TableHead className="text-right font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-neutral-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-neutral-500">
                      暂无客户单位数据
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors border-neutral-100 dark:border-neutral-800">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{company.name}</span>
                          <span className="text-xs text-neutral-400">{getTypeLabel(company.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{company.contact_person || '-'}</span>
                          <span className="text-xs text-neutral-400">{company.contact_phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{company.industry || '-'}</TableCell>
                      <TableCell>{getLevelBadge(company.level)}</TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEdit(company.id)}
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(company.id)}
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

      <CompanyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        companyId={editingId}
        onSuccess={fetchCompanies}
      />
    </div>
  );
}
