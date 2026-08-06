export interface MenuItem {
  id: string;
  title: string;
  parent: string | null;
  path: string;
  icon: string;
  order: number; // 排序权重，越小越靠前
  external: boolean;
  show: boolean;
  userOnly: boolean;
  adminOnly: boolean;
  created: string;
  updated: string;
}

export interface MenuTreeNode extends MenuItem {
  children: MenuTreeNode[];
}
