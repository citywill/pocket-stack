/**
 * 菜单项接口定义
 */
export interface MenuItem {
    title: string;
    path?: string;
    icon: any;
    order?: number; // 排序权重，越小越靠前，默认为 999
    adminOnly?: boolean;
    userOnly?: boolean;
    external?: boolean;
    show?: boolean; // 是否显示，默认为 true
    activePath?: string; // 手动指定激活路径匹配模式（正则表达式或前缀）
    /**
     * 内部字段：来源模块的 package.json `name`，用于按模块隐藏菜单
     * 不需要外部填写，由加载逻辑自动注入
     */
    __moduleName?: string;
    children?: {
        title: string;
        path: string;
        order?: number; // 子菜单排序权重
        adminOnly?: boolean;
        userOnly?: boolean;
        external?: boolean;
        show?: boolean; // 是否显示，默认为 true
    }[];
}

// 自动导入 modules 目录下的所有模块菜单，支持 menu.ts 或 menus.ts
const moduleMenus = import.meta.glob(['../modules/*/menu.ts'], { eager: true });
const modulePackages = import.meta.glob(['../modules/*/package.json'], { eager: true }) as Record<string, any>;

// 模块路径 -> package.json name
const modulePathToPkgName: Record<string, string> = {};
Object.entries(modulePackages).forEach(([path, pkg]) => {
    const match = path.match(/modules\/([^/]+)\//);
    if (match) {
        modulePathToPkgName[match[1]] = pkg.name || match[1];
    }
});

const autoMenus: MenuItem[] = Object.entries(moduleMenus).flatMap(([menuPath, mod]: any) => {
    // 从 menu 文件路径解析模块名（modules/<name>/menu.ts）
    const pathMatch = menuPath.match(/modules\/([^/]+)\//);
    const moduleName = pathMatch ? modulePathToPkgName[pathMatch[1]] || pathMatch[1] : '';

    // 支持 export const menu = ... 或 export default ...
    const menu = mod.menu || mod.default;
    const items = Array.isArray(menu) ? menu : [menu];

    // 过滤掉 show === false 的菜单项，按 order 排序子菜单
    return items.filter(item => item && item.show !== false).map(item => {
        const base = {
            ...item,
            __moduleName: moduleName,
        };
        if (item.children) {
            return {
                ...base,
                children: item.children
                    .filter((child: any) => child.show !== false)
                    .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999))
            };
        }
        return base;
    });
})
.filter(Boolean)
.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

/**
 * 全局侧边栏菜单配置
 * 组合了各个模块的菜单，并应用全局显示过滤逻辑
 */
const allMenus: MenuItem[] = [
    ...autoMenus,
];

export const menuItems: MenuItem[] = allMenus.filter(item => item && item.show !== false).map(item => {
    if (item.children) {
        return {
            ...item,
            children: item.children
                .filter(child => child.show !== false)
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        };
    }
    return item;
});

/**
 * 根据模块名称列表（package.json 的 name）过滤菜单。
 * 处于隐藏列表中的模块对应的所有菜单都会被移除。
 */
export function filterMenusByHiddenModules(menus: MenuItem[], hiddenModuleNames: string[]): MenuItem[] {
    if (!hiddenModuleNames.length) return menus;
    const hiddenSet = new Set(hiddenModuleNames);
    return menus
        .filter(item => !item.__moduleName || !hiddenSet.has(item.__moduleName))
        .map(item => {
            if (!item.children) return item;
            return { ...item };
        });
}

