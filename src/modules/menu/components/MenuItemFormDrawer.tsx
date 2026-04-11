import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select as EditorSelect,
  SelectContent as EditorSelectContent,
  SelectItem as EditorSelectItem,
  SelectTrigger as EditorSelectTrigger,
  SelectValue as EditorSelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { IconPicker } from '@/components/ui/icon-picker';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { MenuItem, MenuTreeNode, MenuType, TargetType } from '../types';

const COLLECTION_NAME = 'system_menu';

interface MenuItemFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
  menuItems: MenuItem[];
  onSuccess: () => void;
}

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

function flattenTreeWithDepth(nodes: MenuTreeNode[], depth = 0): { node: MenuTreeNode; depth: number }[] {
  const result: { node: MenuTreeNode; depth: number }[] = [];
  nodes.forEach((node) => {
    result.push({ node, depth });
    if (node.children.length > 0) {
      result.push(...flattenTreeWithDepth(node.children, depth + 1));
    }
  });
  return result;
}

export function MenuItemFormDrawer({
  open,
  onOpenChange,
  menuItem,
  menuItems,
  onSuccess,
}: MenuItemFormDrawerProps) {
  const [title, setTitle] = useState('');
  const [parent, setParent] = useState<string>('');
  const [type, setType] = useState<MenuType>('route');
  const [path, setPath] = useState('');
  const [icon, setIcon] = useState('');
  const [sort, setSort] = useState(0);
  const [target, setTarget] = useState<TargetType>('_self');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (menuItem) {
      setTitle(menuItem.title);
      setParent(menuItem.parent || '');
      setType(menuItem.type);
      setPath(menuItem.path || '');
      setIcon(menuItem.icon || '');
      setSort(menuItem.sort);
      setTarget(menuItem.target);
      setEnabled(menuItem.enabled);
    } else {
      setTitle('');
      setParent('');
      setType('route');
      setPath('');
      setIcon('');
      setSort(0);
      setTarget('_self');
      setEnabled(true);
    }
  }, [menuItem, open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('请输入菜单标题');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        type,
        path: path.trim(),
        icon: icon.trim(),
        sort,
        target,
        enabled,
      };
      if (parent) {
        payload.parent = parent;
      } else {
        payload.parent = null;
      }

      if (menuItem) {
        await pb.collection(COLLECTION_NAME).update(menuItem.id, payload);
        toast.success('更新成功');
      } else {
        await pb.collection(COLLECTION_NAME).create(payload);
        toast.success('创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const tree = buildTree(menuItems);
  const flattened = flattenTreeWithDepth(tree);
  const parentOptions = flattened.filter(({ node }) => node.id !== menuItem?.id);

  const handleParentChange = (value: string) => {
    setParent(value === '__none__' ? '' : value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{menuItem ? '编辑菜单' : '创建菜单'}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4 pb-8">
          <div className="space-y-2">
            <Label htmlFor="title">菜单标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入菜单标题"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">父级菜单</Label>
            <EditorSelect value={parent || '__none__'} onValueChange={handleParentChange}>
              <EditorSelectTrigger className="rounded-xl">
                <EditorSelectValue placeholder="无父级菜单（顶级）" />
              </EditorSelectTrigger>
              <EditorSelectContent>
                <EditorSelectItem value="__none__">无父级菜单（顶级）</EditorSelectItem>
                {parentOptions.map(({ node, depth }) => (
                  <EditorSelectItem key={node.id} value={node.id}>
                    {'　'.repeat(depth)}{node.title}
                  </EditorSelectItem>
                ))}
              </EditorSelectContent>
            </EditorSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">菜单类型 *</Label>
            <EditorSelect value={type} onValueChange={(v) => setType(v as MenuType)}>
              <EditorSelectTrigger className="rounded-xl">
                <EditorSelectValue />
              </EditorSelectTrigger>
              <EditorSelectContent>
                <EditorSelectItem value="route">路由</EditorSelectItem>
                <EditorSelectItem value="iframe">iframe</EditorSelectItem>
                <EditorSelectItem value="url">外部URL</EditorSelectItem>
              </EditorSelectContent>
            </EditorSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="path">
              {type === 'route' ? '路由路径' : type === 'iframe' ? 'iframe路径' : '外部URL'}
            </Label>
            <Input
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder={
                type === 'route' ? '/example/path' : type === 'iframe' ? '/iframe/path' : 'https://example.com'
              }
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">图标名称</Label>
            <IconPicker value={icon} onChange={setIcon} />
            <p className="text-xs text-gray-500">选择或搜索 heroicons 图标</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort">排序</Label>
            <Input
              id="sort"
              type="number"
              value={sort}
              onChange={(e) => setSort(parseInt(e.target.value) || 0)}
              className="rounded-xl"
            />
            <p className="text-xs text-gray-500">数字越小越靠前</p>
          </div>
          {(type === 'route' || type === 'url') && (
            <div className="space-y-2">
              <Label htmlFor="target">跳转方式</Label>
              <EditorSelect value={target} onValueChange={(v) => setTarget(v as TargetType)}>
                <EditorSelectTrigger className="rounded-xl">
                  <EditorSelectValue />
                </EditorSelectTrigger>
                <EditorSelectContent>
                  <EditorSelectItem value="_self">当前窗口</EditorSelectItem>
                  <EditorSelectItem value="_blank">新窗口</EditorSelectItem>
                </EditorSelectContent>
              </EditorSelect>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>启用菜单</Label>
          </div>
        </div>
        <SheetFooter className="mt-8 flex gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}