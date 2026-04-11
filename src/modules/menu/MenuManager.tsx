import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { MenuItem, MenuTreeNode } from './types';
import { MenuItemFormDrawer } from './components/MenuItemFormDrawer';
import { cn } from '@/lib/utils';
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

const COLLECTION_NAME = 'system_menu';

function buildTree(items: MenuItem[]): MenuTreeNode[] {
  const map = new Map<string, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  map.forEach((node) => {
    if (node.parent && map.has(node.parent)) {
      map.get(node.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  roots.sort((a, b) => a.sort - b.sort);
  map.forEach((node) => {
    node.children.sort((a, b) => a.sort - b.sort);
  });

  return roots;
}

function MenuItemRow({
  node,
  depth,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  node: MenuTreeNode;
  depth: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 hover:bg-gray-50 transition-colors rounded-lg'
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {depth > 0 && (
          <span className="text-xs text-gray-400 w-6 text-center border-l border-gray-200 ml-2">
          </span>
        )}
            {hasChildren ? (
              <button
                onClick={() => onToggle(node.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-7" />
            )}
            {node.icon && (() => {
              const IconComponent = (HeroIcons as Record<string, React.ComponentType<{ className?: string }>>)[node.icon];
              return IconComponent ? <IconComponent className="w-4 h-4 text-gray-500" /> : null;
            })()}
            <span className="font-medium truncate">{node.title}</span>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs',
              node.type === 'route' && 'bg-blue-100 text-blue-700',
              node.type === 'iframe' && 'bg-red-100 text-red-700',
              node.type === 'url' && 'bg-green-100 text-green-700'
            )}>
              {node.type === 'route' ? '路由' : node.type === 'iframe' ? 'iframe' : 'URL'}
            </span>
            {!node.enabled && (
              <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                已禁用
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(node)}
              className="rounded-xl"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(node.id)}
              className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
}

export function MenuManager() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [treeData, setTreeData] = useState<MenuTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await pb.collection(COLLECTION_NAME).getFullList({
        sort: 'sort',
        requestKey: null,
      });
      const items = result as unknown as MenuItem[];
      setMenuItems(items);
      setTreeData(buildTree(items));
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      toast.error('获取菜单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = () => {
    setCurrentMenuItem(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setCurrentMenuItem(item);
    setFormDrawerOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await pb.collection(COLLECTION_NAME).delete(deleteTargetId);
      toast.success('删除成功');
      fetchMenuItems();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const renderTreeNode = (node: MenuTreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
      <div key={node.id}>
        <MenuItemRow
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          onToggle={toggleExpand}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">菜单管理</h1>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
          <PlusIcon className="w-4 h-4 mr-2" />
          创建菜单
        </Button>
      </div>

      <Card className="p-4">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : treeData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无菜单</div>
          ) : (
            <div>
              {treeData.map((node) => renderTreeNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      <MenuItemFormDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        menuItem={currentMenuItem}
        menuItems={menuItems}
        onSuccess={fetchMenuItems}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个菜单吗？子菜单也会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}