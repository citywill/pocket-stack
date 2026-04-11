export type MenuType = 'route' | 'iframe' | 'url';

export type TargetType = '_self' | '_blank';

export interface MenuItem {
  id: string;
  title: string;
  parent: string | null;
  type: MenuType;
  path: string;
  icon: string;
  sort: number;
  target: TargetType;
  enabled: boolean;
  created: string;
  updated: string;
}

export interface MenuTreeNode extends MenuItem {
  children: MenuTreeNode[];
}