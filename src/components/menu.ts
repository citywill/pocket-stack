import { adminMenu } from '@/pages/admin/menu';

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

// 自动导入 modules 目录下的所有模块菜单，支持 menu.ts 或 menus.ts
const moduleMenus = import.meta.glob(['../modules/*/menu.ts'], { eager: true });
const autoMenus: MenuItem[] = Object.values(moduleMenus).flatMap((mod: any) => {
    // 支持 export const menu = ... 或 export default ...
    const menu = mod.menu || mod.default;
    return Array.isArray(menu) ? menu : [menu];
}).filter(Boolean);

/**
 * 全局侧边栏菜单配置
 * 组合了各个模块的菜单
 */
export const menuItems: MenuItem[] = [
    ...adminMenu,
    ...autoMenus,
];
