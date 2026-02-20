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
    show?: boolean; // 是否显示，默认为 true
    activePath?: string; // 手动指定激活路径匹配模式（正则表达式或前缀）
    children?: {
        title: string;
        path: string;
        adminOnly?: boolean;
        userOnly?: boolean;
        external?: boolean;
        show?: boolean; // 是否显示，默认为 true
    }[];
}

// 自动导入 modules 目录下的所有模块菜单，支持 menu.ts 或 menus.ts
const moduleMenus = import.meta.glob(['../modules/*/menu.ts'], { eager: true });
const autoMenus: MenuItem[] = Object.values(moduleMenus).flatMap((mod: any) => {
    // 支持 export const menu = ... 或 export default ...
    const menu = mod.menu || mod.default;
    const items = Array.isArray(menu) ? menu : [menu];

    // 过滤掉 show === false 的菜单项及其子菜单
    return items.filter(item => item && item.show !== false).map(item => {
        if (item.children) {
            return {
                ...item,
                children: item.children.filter((child: any) => child.show !== false)
            };
        }
        return item;
    });
}).filter(Boolean);

/**
 * 全局侧边栏菜单配置
 * 组合了各个模块的菜单，并应用全局显示过滤逻辑
 */
const allMenus: MenuItem[] = [
    ...adminMenu,
    ...autoMenus,
];

export const menuItems: MenuItem[] = allMenus.filter(item => item && item.show !== false).map(item => {
    if (item.children) {
        return {
            ...item,
            children: item.children.filter(child => child.show !== false)
        };
    }
    return item;
});
