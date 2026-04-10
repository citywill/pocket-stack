export interface Category {
  id: string;
  name: string;
  parent: string | null;
  created: string;
  updated: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  user: string;
  expand?: {
    category?: Category;
  };
  created: string;
  updated: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}
