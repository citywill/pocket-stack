import { adminMenu } from '@/pages/admin/menu';
import { exampleMenu } from '@/pages/examples/menu';

/**
 * 菜单项接口定义
 */
export interface MenuItem {
    title: string;
    path?: string;
    icon: any;
    adminOnly?: boolean;
    userOnly?: boolean;
    external?: boolean;
    children?: {
        title: string;
        path: string;
        adminOnly?: boolean;
        userOnly?: boolean;
        external?: boolean;
    }[];
}

/**
 * 全局侧边栏菜单配置
 * 组合了各个模块的菜单
 */
export const menuItems: MenuItem[] = [
    ...adminMenu,
    exampleMenu,
];
