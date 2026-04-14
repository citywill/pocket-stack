import { useState, useEffect } from 'react';
import { ChevronRightIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parent: string | null;
}

interface CategoryTreeNode {
  id: string;
  name: string;
  parent: string | null;
  children: CategoryTreeNode[];
}

interface TreeSelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  placeholder?: string;
  disabled?: boolean;
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

function FlatTreeNode({
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
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <ChevronRightIcon className="w-4 h-4 shrink-0" />
        ) : (
          <span className="w-4" />
        )}
        {hasChildren ? (
          <FolderOpenIcon className="w-4 h-4 shrink-0" />
        ) : (
          <FolderIcon className="w-4 h-4 shrink-0" />
        )}
        <span className="truncate text-sm">{node.name}</span>
      </div>
      {hasChildren && (
        <div>
          {node.children.map((child) => (
            <FlatTreeNode
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

export function TreeSelect({
  value,
  onChange,
  categories,
  placeholder = '选择分类',
  disabled = false,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);

  const selectedCategory = categories.find((c) => c.id === value);

  useEffect(() => {
    const tree = buildTree(categories);
    setTreeData(tree);
  }, [categories]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between rounded-xl font-normal"
        >
          {selectedCategory ? (
            <span className="flex items-center gap-2 truncate">
              <FolderIcon className="w-4 h-4 shrink-0" />
              {selectedCategory.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2">
          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-1',
              !value ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            <FolderIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm">无上级分类（顶级）</span>
          </div>
          {treeData.map((node) => (
            <FlatTreeNode
              key={node.id}
              node={node}
              selectedId={value}
              onSelect={(id) => {
                onChange(id || '');
                setOpen(false);
              }}
              depth={0}
            />
          ))}
          {treeData.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">暂无分类</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}