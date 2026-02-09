import { useState, useMemo, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// --- Types ---
interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
  size: string;
  updatedAt: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  author: string;
}

// --- Mock Data ---
const DOCUMENTS: Document[] = [
  {
    id: '1',
    name: '2024 年度市场调研报告.pdf',
    type: 'pdf',
    size: '4.2 MB',
    updatedAt: '2024-12-20',
    category: '市场',
    status: 'published',
    author: '张三',
  },
  {
    id: '2',
    name: '产品设计规范 v2.1.doc',
    type: 'doc',
    size: '1.8 MB',
    updatedAt: '2024-12-18',
    category: '设计',
    status: 'published',
    author: '李四',
  },
  {
    id: '3',
    name: '核心资产列表 - 机密.pdf',
    type: 'pdf',
    size: '850 KB',
    updatedAt: '2024-12-15',
    category: '行政',
    status: 'published',
    author: '王五',
  },
  {
    id: '4',
    name: '新版 Logo 设计稿.png',
    type: 'image',
    size: '12.5 MB',
    updatedAt: '2024-12-22',
    category: '设计',
    status: 'draft',
    author: '赵六',
  },
  {
    id: '5',
    name: 'Q4 季度财务报表.xlsx',
    type: 'other',
    size: '2.1 MB',
    updatedAt: '2024-12-10',
    category: '财务',
    status: 'archived',
    author: '孙七',
  },
  {
    id: '6',
    name: '员工入职培训手册.pdf',
    type: 'pdf',
    size: '3.4 MB',
    updatedAt: '2024-12-05',
    category: '人事',
    status: 'published',
    author: '周八',
  },
  {
    id: '7',
    name: '技术架构演进方案.doc',
    type: 'doc',
    size: '5.6 MB',
    updatedAt: '2024-12-21',
    category: '技术',
    status: 'draft',
    author: '吴九',
  },
  {
    id: '8',
    name: '办公区装修效果图.jpg',
    type: 'image',
    size: '8.2 MB',
    updatedAt: '2024-11-28',
    category: '行政',
    status: 'published',
    author: '郑十',
  },
  {
    id: '9',
    name: '2025 全球技术趋势分析.pdf',
    type: 'pdf',
    size: '15.2 MB',
    updatedAt: '2024-12-23',
    category: '技术',
    status: 'published',
    author: '钱十一',
  },
  {
    id: '10',
    name: '品牌视觉识别系统 (VI) 手册.pdf',
    type: 'pdf',
    size: '28.5 MB',
    updatedAt: '2024-12-22',
    category: '设计',
    status: 'published',
    author: '孙十二',
  },
  {
    id: '11',
    name: '新员工入职合同模板.doc',
    type: 'doc',
    size: '120 KB',
    updatedAt: '2024-12-20',
    category: '人事',
    status: 'draft',
    author: '李十三',
  },
  {
    id: '12',
    name: '办公区 5G 网络覆盖方案.pdf',
    type: 'pdf',
    size: '4.7 MB',
    updatedAt: '2024-12-19',
    category: '技术',
    status: 'published',
    author: '周十四',
  },
];

const CATEGORIES = ['全部', '市场', '设计', '行政', '财务', '人事', '技术'];

export function ExampleCard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // --- Filtered Data ---
  const filteredDocs = useMemo(() => {
    return DOCUMENTS.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '全部' || doc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // --- Paginated Data ---
  const totalPages = Math.ceil(filteredDocs.length / pageSize);
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage, pageSize]);

  // --- Helper: Icon by File Type ---
  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf':
        return <DocumentTextIcon className="h-10 w-10 text-rose-500" />;
      case 'doc':
        return <DocumentIcon className="h-10 w-10 text-blue-500" />;
      case 'image':
        return <PhotoIcon className="h-10 w-10 text-emerald-500" />;
      default:
        return <DocumentIcon className="h-10 w-10 text-neutral-400" />;
    }
  };

  // --- Helper: Status Badge ---
  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1">
            <CheckCircleIcon className="size-3" /> 已发布
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1">
            <PencilSquareIcon className="size-3" /> 草稿
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-neutral-50 text-neutral-500 border-neutral-100 flex items-center gap-1">
            <InformationCircleIcon className="size-3" /> 已归档
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            文档中心
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-2xl dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]">
            <PlusIcon className="size-5" /> 上传文档
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-none dark:bg-neutral-900/50 p-1 rounded-2xl">
        <CardContent className="p-2 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              placeholder="搜索文档名称..."
              className="pl-11 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-full px-5 h-9 transition-all',
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-neutral-600 hover:bg-white dark:hover:bg-neutral-800'
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid Section */}
      {paginatedDocs.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedDocs.map((doc) => (
              <Card
                key={doc.id}
                className="group border-neutral-200/60 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 py-0 gap-0"
              >
                <CardHeader className="p-5 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      {getFileIcon(doc.type)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                          <EllipsisVerticalIcon className="size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5">
                        <DropdownMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer">
                          <PencilSquareIcon className="size-4" /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer">
                          <ShareIcon className="size-4" /> 分享
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer text-blue-600">
                          <ArrowDownTrayIcon className="size-4" /> 下载
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer text-rose-600 focus:text-rose-600">
                          <TrashIcon className="size-4" /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-base font-semibold line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                    {doc.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-2">
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusBadge(doc.status)}
                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 border-none font-normal">
                      {doc.category}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-500">
                    <div className="flex justify-between">
                      <span>大小</span>
                      <span className="text-neutral-900 dark:text-neutral-300 font-medium">{doc.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>修改者</span>
                      <span className="text-neutral-900 dark:text-neutral-300 font-medium">{doc.author}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-5 py-4 bg-neutral-50/50 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center mt-2">
                  <span className="text-xs text-neutral-400">{doc.updatedAt}</span>
                  <Button variant="link" className="h-auto p-0 text-blue-600 hover:text-blue-700 font-semibold text-sm">
                    预览文档
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-6">
              <div className="text-sm text-neutral-500">
                显示第 <span className="font-medium text-neutral-900 dark:text-neutral-200">{(currentPage - 1) * pageSize + 1}</span> 到 <span className="font-medium text-neutral-900 dark:text-neutral-200">{Math.min(currentPage * pageSize, filteredDocs.length)}</span> 条，共 <span className="font-medium text-neutral-900 dark:text-neutral-200">{filteredDocs.length}</span> 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 px-3 gap-1"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="size-4" />
                  上一页
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all",
                        currentPage === page ? "bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none" : "text-neutral-600"
                      )}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 px-3 gap-1"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-full shadow-sm mb-4">
            <MagnifyingGlassIcon className="h-10 w-10 text-neutral-300" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">未找到相关文档</h3>
          <p className="text-neutral-500 mt-1">尝试调整搜索关键词或筛选条件</p>
          <Button
            variant="outline"
            className="mt-6 rounded-xl"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('全部');
            }}
          >
            重置所有条件
          </Button>
        </div>
      )}
    </div>
  );
}
