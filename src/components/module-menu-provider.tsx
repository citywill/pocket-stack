import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { pb } from '@/lib/pocketbase';

interface ModuleMenuContextValue {
  /** 被隐藏菜单的模块名列表（package.json 的 name） */
  hiddenModules: string[];
  /** 是否正在加载 */
  loading: boolean;
  /** 重新加载隐藏模块列表（变更后调用以同步） */
  refresh: () => Promise<void>;
}

const ModuleMenuContext = createContext<ModuleMenuContextValue | undefined>(undefined);

export function ModuleMenuProvider({ children }: { children: ReactNode }) {
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const records = await pb.collection('system_modules').getFullList({
        requestKey: null,
      });
      const hidden = records
        .filter((r: any) => r.show_menu === false)
        .map((r: any) => r.name);
      setHiddenModules(hidden);
    } catch (error) {
      // 集合可能未创建，静默忽略
      setHiddenModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ModuleMenuContext.Provider value={{ hiddenModules, loading, refresh }}>
      {children}
    </ModuleMenuContext.Provider>
  );
}

export function useModuleMenu(): ModuleMenuContextValue {
  const ctx = useContext(ModuleMenuContext);
  if (!ctx) {
    throw new Error('useModuleMenu must be used within ModuleMenuProvider');
  }
  return ctx;
}
