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
            icon: (HeroIcons as any)[item.icon] || StopIcon,            external: item.external,
            show: item.show,
        };
        map.set(item.id, { menuItem, item });
    });

    map.forEach(({ menuItem, item }) => {
        if (item.parent && map.has(item.parent)) {
            const parent = map.get(item.parent)!.menuItem;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(menuItem);
        } else {
            roots.push(menuItem);
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
            sort: 'sort',
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