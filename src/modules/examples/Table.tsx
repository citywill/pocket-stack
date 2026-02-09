import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

// --- Types ---

type OrderStatus = 'completed' | 'pending' | 'processing' | 'cancelled';

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: OrderStatus;
  category: string;
  date: string;
}

// --- Mock Data ---

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-001', customer: '张三', amount: 1234, status: 'completed', category: '电子产品', date: '2024-12-18T10:00:00Z' },
  { id: 'ORD-002', customer: '李四', amount: 2345, status: 'pending', category: '服装鞋帽', date: '2024-12-18T14:30:00Z' },
  { id: 'ORD-003', customer: '王五', amount: 3456, status: 'processing', category: '食品饮料', date: '2024-12-17T09:15:00Z' },
  { id: 'ORD-004', customer: '赵六', amount: 567, status: 'cancelled', category: '日用百货', date: '2024-12-16T16:45:00Z' },
  { id: 'ORD-005', customer: '钱七', amount: 8900, status: 'completed', category: '电子产品', date: '2024-12-15T11:20:00Z' },
  { id: 'ORD-006', customer: '孙八', amount: 120, status: 'completed', category: '食品饮料', date: '2024-12-14T08:00:00Z' },
  { id: 'ORD-007', customer: '周九', amount: 4500, status: 'processing', category: '服装鞋帽', date: '2024-12-13T13:10:00Z' },
  { id: 'ORD-008', customer: '吴十', amount: 3200, status: 'pending', category: '电子产品', date: '2024-12-12T15:55:00Z' },
  { id: 'ORD-009', customer: '郑十一', amount: 150, status: 'completed', category: '日用百货', date: '2024-12-11T10:30:00Z' },
  { id: 'ORD-010', customer: '王十二', amount: 2800, status: 'completed', category: '电子产品', date: '2024-12-10T14:20:00Z' },
  { id: 'ORD-011', customer: '李十三', amount: 99, status: 'cancelled', category: '食品饮料', date: '2024-12-09T09:40:00Z' },
  { id: 'ORD-012', customer: '张十四', amount: 5600, status: 'processing', category: '服装鞋帽', date: '2024-12-08T11:00:00Z' },
];

const CATEGORIES = ['电子产品', '服装鞋帽', '食品饮料', '日用百货', '其他'];
const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'completed', label: '已完成' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'cancelled', label: '已取消' },
];

export function ExampleTable() {
  // --- State ---
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [sortField, setSortField] = useState<keyof Order>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<Partial<Order>>({});

  // AlertDialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // --- Derived Data ---
  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.customer.toLowerCase().includes(search.toLowerCase()) ||
          order.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        let matchesDate = true;
        if (dateRange?.from) {
          const orderDate = parseISO(order.date);
          const start = startOfDay(dateRange.from);
          const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
          matchesDate = isWithinInterval(orderDate, { start, end });
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [orders, search, statusFilter, dateRange, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / pageSize);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedOrders.slice(start, start + pageSize);
  }, [filteredAndSortedOrders, currentPage, pageSize]);

  // --- Handlers ---
  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData(order);
    } else {
      setEditingOrder(null);
      setFormData({
        id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
        customer: '',
        amount: 0,
        status: 'pending',
        category: CATEGORIES[0],
        date: new Date().toISOString(),
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingOrder) {
      setOrders(orders.map((o) => (o.id === editingOrder.id ? (formData as Order) : o)));
    } else {
      setOrders([formData as Order, ...orders]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      setOrders(orders.filter((o) => o.id !== deleteTargetId));
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            订单管理示例
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            这是一个包含过滤、排序、分页和 CRUD 操作的通用表格示例。
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="mr-2 h-4 w-4" />
          创建订单
        </Button>
      </div>

      {/* --- Filters --- */}
      <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl">
        <div className="flex gap-4">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <Input
              placeholder="搜索客户或订单号..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger>
              <FunnelIcon className="mr-2 h-4 w-4 text-neutral-400" />
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !dateRange && 'text-neutral-400'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'yyyy-MM-dd')} -{' '}
                      {format(dateRange.to, 'yyyy-MM-dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'yyyy-MM-dd')
                  )
                ) : (
                  <span>选择日期范围</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDateRange(undefined);
            }}
            className="text-neutral-500"
          >
            重置筛选
          </Button>
        </div>
      </div>

      {/* --- Table --- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>订单列表</CardTitle>
            <span className="text-sm text-neutral-500">
              共 {filteredAndSortedOrders.length} 条记录
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th
                    className="cursor-pointer pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      订单号
                      <ArrowsUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center gap-1">
                      客户
                      <ArrowsUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      金额
                      <ArrowsUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    分类
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    状态
                  </th>
                  <th
                    className="cursor-pointer pb-3 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      日期
                      <ArrowsUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="py-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {order.id}
                    </td>
                    <td className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {order.customer}
                    </td>
                    <td className="py-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      ¥{order.amount.toLocaleString()}
                    </td>
                    <td className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {order.category}
                    </td>
                    <td className="py-4">
                      <Badge
                        className={cn(
                          order.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                          order.status === 'pending' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                          order.status === 'processing' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                          order.status === 'cancelled' && 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400'
                        )}
                        variant="secondary"
                      >
                        {STATUS_OPTIONS.find((s) => s.value === order.status)?.label}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {format(parseISO(order.date), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(order)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(order.id)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Pagination --- */}
          <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">
              第 {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredAndSortedOrders.length)} 条，共{' '}
              {filteredAndSortedOrders.length} 条
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                上一页
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Add/Edit Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingOrder ? '编辑订单' : '创建新订单'}</DialogTitle>
            <DialogDescription>
              请输入订单的详细信息，完成后点击保存。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id" className="text-right">
                订单号
              </Label>
              <Input
                id="id"
                disabled
                value={formData.id || ''}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                客户姓名
              </Label>
              <Input
                id="customer"
                value={formData.customer || ''}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                金额
              </Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount || 0}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                分类
              </Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                状态
              </Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as OrderStatus })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter(o => o.value !== 'all').map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除此订单吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。删除后，该订单将从本地模拟数据中移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              确定删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
