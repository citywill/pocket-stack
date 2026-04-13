import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CubeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ModuleInfo {
  name: string;
  version: string;
  title: string;
  description: string;
  path: string;
  hasMigrations: boolean;
  migrations: string[];
}

interface SystemModuleRecord {
  id: string;
  name: string;
  initialized: boolean;
}

interface ModuleInfoWithStatus extends ModuleInfo {
  initialized: boolean;
}

const modulePackages = import.meta.glob('/src/modules/*/package.json', { eager: true }) as Record<string, any>;
const moduleMigrations = import.meta.glob('/src/modules/*/migrations/*.json', { eager: true }) as Record<string, any>;

function extractModuleName(path: string): string {
  const match = path.match(/modules\/([^/]+)\//);
  return match ? match[1] : '';
}

export function Modules() {
  const [modules, setModules] = useState<ModuleInfoWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializingModules, setInitializingModules] = useState<Set<string>>(new Set());
  const [initConfirmOpen, setInitConfirmOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleInfoWithStatus | null>(null);
  const [systemModulesCollectionExists, setSystemModulesCollectionExists] = useState<boolean | null>(null);
  const [systemModulesCollectionError, setSystemModulesCollectionError] = useState<string | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const systemModules = await pb.collection('system_modules').getFullList<SystemModuleRecord>({
        requestKey: null,
      });

      const initializedMap = new Map<string, boolean>();
      systemModules.forEach((m) => {
        initializedMap.set(m.name, m.initialized);
      });

      const moduleList: ModuleInfoWithStatus[] = Object.entries(modulePackages)
        .filter(([path]) => !path.includes('/modules/modules/'))
        .map(([path, pkg]) => {
          const moduleName = extractModuleName(path);
        const migrationPathPrefix = `/src/modules/${moduleName}/migrations/`;
        const moduleMigrationFiles: string[] = [];

        Object.keys(moduleMigrations).forEach((mPath) => {
          if (mPath.startsWith(migrationPathPrefix)) {
            const fileName = mPath.split('/').pop() || '';
            moduleMigrationFiles.push(fileName);
          }
        });

        return {
          name: pkg.name || moduleName,
          version: pkg.version || '1.0.0',
          title: pkg.title || moduleName,
          description: pkg.description || '',
          path: `/modules/${moduleName}`,
          hasMigrations: moduleMigrationFiles.length > 0,
          migrations: moduleMigrationFiles,
          initialized: initializedMap.get(pkg.name || moduleName) || false,
        };
      });

      setModules(moduleList);
    } catch (error: any) {
      if (!error.isAbort) {
        if (error.status === 404) {
          setSystemModulesCollectionExists(false);
          setSystemModulesCollectionError(null);
        } else {
          console.error('Failed to fetch modules:', error);
          toast.error('获取模块列表失败');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSystemModulesCollection = async (signal?: AbortSignal) => {
    try {
      await pb.collections.getOne('system_modules', { signal, requestKey: null });
      setSystemModulesCollectionExists(true);
      fetchModules();
    } catch (error: any) {
      if (error.isAbort) return;
      if (error.status === 404) {
        setSystemModulesCollectionExists(false);
      } else {
        setSystemModulesCollectionError(error.message || '检查集合失败');
      }
      setLoading(false);
    }
  };

  const handleCreateSystemModulesCollection = async () => {
    setInitializingModules((prev) => new Set(prev).add('__system__'));
    try {
      const systemModulesMigration = moduleMigrations['/src/modules/modules/migrations/system_modules.json'];
      const collections = systemModulesMigration?.default || systemModulesMigration;
      if (Array.isArray(collections)) {
        for (const collection of collections) {
          await pb.collections.create(collection);
        }
      }
      toast.success('系统模块集合初始化成功');
      checkSystemModulesCollection();
    } catch (error: any) {
      if (error.isAbort) return;
      console.error('Failed to create system_modules collection:', error);
      toast.error(`初始化失败: ${error.message || '未知错误'}`);
    } finally {
      setInitializingModules((prev) => {
        const next = new Set(prev);
        next.delete('__system__');
        return next;
      });
    }
  };

  useEffect(() => {
    checkSystemModulesCollection();
  }, []);

  const handleInitializeClick = (module: ModuleInfoWithStatus) => {
    setSelectedModule(module);
    setInitConfirmOpen(true);
  };

  const confirmInitialize = async () => {
    if (!selectedModule) return;

    const moduleName = selectedModule.name;
    setInitializingModules((prev) => new Set(prev).add(moduleName));
    setInitConfirmOpen(false);

    try {
      const migrationPathPrefix = `/src/modules/${moduleName}/migrations/`;
      const migrationFiles = Object.entries(moduleMigrations)
        .filter(([path]) => path.startsWith(migrationPathPrefix))
        .sort(([a], [b]) => a.localeCompare(b));

      for (const [, content] of migrationFiles) {
        const collections = content.default || content;
        if (Array.isArray(collections)) {
          for (const collection of collections) {
            await pb.collections.create(collection);
          }
        }
      }

      await pb.collection('system_modules').create({
        name: moduleName,
        initialized: true,
      });

      toast.success(`模块「${selectedModule.title}」初始化成功`);
      fetchModules();
    } catch (error: any) {
      console.error('Failed to initialize module:', error);
      toast.error(`初始化失败: ${error.message || '未知错误'}`);
    } finally {
      setInitializingModules((prev) => {
        const next = new Set(prev);
        next.delete(moduleName);
        return next;
      });
      setSelectedModule(null);
    }
  };

  if (loading || systemModulesCollectionExists === null) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载模块列表中...</div>
      </div>
    );
  }

  if (!systemModulesCollectionExists) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <CubeIcon className="h-8 w-8 text-primary" />
            模块管理
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            查看系统中所有模块的状态，支持模块数据初始化。
          </p>
        </div>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ExclamationCircleIcon className="h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              系统模块集合未初始化
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-6">
              在使用模块管理功能之前，需要先初始化系统模块集合。
              这将创建一个用于存储模块状态的基础集合。
            </p>
            {systemModulesCollectionError && (
              <p className="text-red-500 text-sm mb-4">{systemModulesCollectionError}</p>
            )}
            <Button
              onClick={handleCreateSystemModulesCollection}
              disabled={initializingModules.has('__system__')}
              className="rounded-xl"
            >
              {initializingModules.has('__system__') ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  初始化中...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  初始化系统模块
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <CubeIcon className="h-8 w-8 text-primary" />
          模块管理
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          查看系统中所有模块的状态，支持模块数据初始化。
        </p>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">模块列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    模块名称
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    版本
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    描述
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    迁移文件
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    状态
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => {
                  const isInitializing = initializingModules.has(module.name);
                  return (
                    <tr
                      key={module.name}
                      className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {module.title}
                        </div>
                        <div className="text-xs text-neutral-400">{module.name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                        v{module.version}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                        {module.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {module.hasMigrations ? (
                          <Badge variant="secondary" className="text-xs">
                            {module.migrations.length} 个文件
                          </Badge>
                        ) : (
                          <span className="text-xs text-neutral-400">无</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {module.initialized ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            已初始化
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-neutral-500 gap-1">
                            <ExclamationCircleIcon className="h-3 w-3" />
                            未初始化
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {module.hasMigrations && !module.initialized && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInitializeClick(module)}
                            disabled={isInitializing}
                            className="rounded-xl"
                          >
                            {isInitializing ? (
                              <>
                                <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                                初始化中...
                              </>
                            ) : (
                              <>
                                <ArrowPathIcon className="h-4 w-4 mr-1" />
                                初始化
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {modules.length === 0 && (
              <div className="py-12 text-center text-neutral-500">
                暂无模块
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={initConfirmOpen} onOpenChange={setInitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认初始化模块</AlertDialogTitle>
            <AlertDialogDescription>
              确定要初始化模块「{selectedModule?.title}」吗？这将把以下迁移文件导入到 PocketBase：
              <ul className="mt-2 list-disc list-inside text-sm">
                {selectedModule?.migrations.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
              <p className="mt-2 text-amber-600 dark:text-amber-400">
                此操作不可逆，请确保 PocketBase 服务正在运行。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmInitialize}>确认初始化</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
