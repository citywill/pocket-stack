import { useState, useEffect, useCallback } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import type { Category, CategoryTreeNode } from '../types';
import { cn } from '@/lib/utils';

interface CategoryTreeProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function buildTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach((node) => {
    if (node.parent && map.has(node.parent)) {
      map.get(node.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  depth = 0,
}: {
  node: CategoryTreeNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDownIcon className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}
        {expanded || !hasChildren ? (
          <FolderOpenIcon className="w-4 h-4 shrink-0" />
        ) : (
          <FolderIcon className="w-4 h-4 shrink-0" />
        )}
        <span className="truncate text-sm">{node.name}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({ selectedId, onSelect }: CategoryTreeProps) {
  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await pb.collection('treenote_categories').getFullList({
        sort: 'created',
        requestKey: null,
      });
      const tree = buildTree(result as unknown as Category[]);
      setTreeData(tree);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">加载中...</div>;
  }

  return (
    <div className="p-2">
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-1',
          selectedId === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        )}
        onClick={() => onSelect(null)}
      >
        <FolderIcon className="w-4 h-4 shrink-0" />
        <span className="text-sm">全部笔记</span>
      </div>
      {treeData.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
      {treeData.length === 0 && (
        <div className="p-4 text-sm text-gray-500 text-center">暂无分类</div>
      )}
    </div>
  );
}