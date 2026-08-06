export interface MenuItem {
  id: string;
  title: string;
  parent: string | null;
  path: string;
  icon: string;
  sort: number;
  external: boolean;
  show: boolean;
  created: string;
  updated: string;
}

export interface MenuTreeNode extends MenuItem {
  children: MenuTreeNode[];
}