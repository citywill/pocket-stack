import { pb } from '@/lib/pocketbase';
import * as HeroIcons from '@heroicons/react/24/outline';
import { StopIcon } from '@heroicons/react/24/outline';
import type { MenuItem } from '@/components/menu';
import type { MenuItem as SystemMenuItem } from './types';

export { type MenuItem as SystemMenuItem } from './types';

function buildSystemMenuTree(items: SystemMenuItem[]): MenuItem[] {
    const map = new Map<string, { menuItem: MenuItem; item: SystemMenuItem }>();
    const roots: MenuItem[] = [];

    items.forEach((item) => {
        const menuItem: MenuItem = {
            title: item.title,
            path: item.path,
            icon: (HeroIcons as any)[item.icon] || StopIcon,
            order: item.order ?? 999,
            external: item.external,
            show: item.show,
            userOnly: item.userOnly ?? false,
            adminOnly: item.adminOnly ?? false,
        };
        map.set(item.id, { menuItem, item });
    });

    map.forEach(({ menuItem, item }) => {
        if (item.parent && map.has(item.parent)) {
            const parent = map.get(item.parent)!.menuItem;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(menuItem as any);
        } else {
            roots.push(menuItem);
        }
    });

    // 按 order 排序根节点（fallback 到 999）
    roots.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // 按 order 排序子节点
    map.forEach(({ menuItem }) => {
        if (menuItem.children && menuItem.children.length > 1) {
            menuItem.children.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
        }
    });

    return roots;
}

let systemMenuCache: MenuItem[] | null = null;

export async function getSystemMenu(): Promise<MenuItem[]> {
    if (systemMenuCache) {
        return systemMenuCache;
    }

    try {
        const records = await pb.collection('system_menu').getFullList({
            sort: 'order',
            $autoCancel: false,
        });
        const items = records as unknown as SystemMenuItem[];
        systemMenuCache = buildSystemMenuTree(items);
        return systemMenuCache;
    } catch (error) {
        console.error('Failed to fetch system menu:', error);
        return [];
    }
}

export function clearSystemMenuCache() {
    systemMenuCache = null;
}
