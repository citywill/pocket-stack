import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CircleStackIcon as DatabaseIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// 使用 Vite 的 import.meta.glob 动态导入 migrations 目录下的所有 JSON 文件
const migrationFiles = import.meta.glob('../../../migrations/*.json', { eager: true });

export function Install() {
  const [installing, setInstalling] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [steps, setSteps] = useState<{
    name: string;
    status: 'pending' | 'loading' | 'success' | 'error';
    message?: string;
  }[]>([
    { name: '扫描迁移文件', status: 'pending' },
    { name: '初始化数据库集合', status: 'pending' },
    { name: '完成安装', status: 'pending' }
  ]);

  useEffect(() => {
    checkInstallStatus();
  }, []);

  const checkInstallStatus = async () => {
    try {
      setChecking(true);
      // 检查 system_settings 集合是否存在
      // 使用 requestKey: null 禁用自动取消功能，防止在 StrictMode 或快速重载下报错
      await pb.collections.getOne('system_settings', { requestKey: null });
      setIsInstalled(true);
      // 如果已安装，将所有步骤标记为成功
      setSteps(prev => prev.map(step => ({ ...step, status: 'success' })));
    } catch (error: any) {
      if (error.isAbort) return; // 忽略正常的取消请求

      if (error.status === 404) {
        setIsInstalled(false);
      } else {
        console.error('Check install status error:', error);
      }
    } finally {
      setChecking(false);
    }
  };

  const updateStep = (index: number, status: 'pending' | 'loading' | 'success' | 'error', message?: string) => {
    setSteps(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status, message };
      return next;
    });
  };

  const handleInstall = async () => {
    try {
      setInstalling(true);

      // 第一步：扫描迁移文件
      updateStep(0, 'loading');
      const files = Object.keys(migrationFiles);
      if (files.length === 0) {
        updateStep(0, 'error', '未发现任何迁移文件');
        throw new Error('未发现任何迁移文件');
      }
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(0, 'success', `发现 ${files.length} 个配置文件`);

      // 第二步：导入所有集合配置
      updateStep(1, 'loading');
      try {
        const allCollections: any[] = [];

        // 收集所有文件中的集合定义
        for (const path in migrationFiles) {
          const config = (migrationFiles[path] as any).default || migrationFiles[path];
          const collections = Array.isArray(config) ? config : [config];
          allCollections.push(...collections);
        }

        if (allCollections.length > 0) {
          // 使用 PocketBase 的批量导入功能，它会自动处理集合间的关联顺序
          // 注意：import 接口会替换整个数据库结构，deleteMissing: false 保证不删除现有集合
          // 同样使用 requestKey: null 确保长连接不被意外取消
          await pb.collections.import(allCollections, false, { requestKey: null });
          updateStep(1, 'success', `成功同步 ${allCollections.length} 个集合`);
        } else {
          updateStep(1, 'success', '没有需要同步的集合');
        }
      } catch (error: any) {
        console.error('Import error detail:', error.data || error);
        const detailMsg = error.data ? Object.entries(error.data).map(([k, v]: [any, any]) => {
          const val = typeof v === 'object' ? JSON.stringify(v) : v;
          return `${k}: ${val}`;
        }).join(', ') : '';
        updateStep(1, 'error', (error.message || '导入失败') + (detailMsg ? ` (${detailMsg})` : ''));
        throw error;
      }

      // 第三步：完成
      updateStep(2, 'success');
      setIsInstalled(true);
      toast.success('所有迁移文件导入成功');
    } catch (error: any) {
      toast.error(`安装失败: ${error.message}`);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl rounded-2xl border-none shadow-lg bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
            <DatabaseIcon className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">系统安装与初始化</CardTitle>
          <CardDescription>
            此工具将帮助您初始化 PocketBase 数据库结构并导入必要的系统设置。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled && !installing && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
              <div className="flex gap-3">
                <InformationCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-300">
                  <p className="font-semibold mb-1">系统已就绪</p>
                  <p className="opacity-80">检测到系统核心集合已存在，说明安装已完成。如果您需要重新初始化或更新集合结构，可以再次点击下方按钮。</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">注意事项</p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                  <li>导入操作可能会覆盖现有的集合设置。</li>
                  <li>请确保您拥有管理员（Superuser）权限。</li>
                  <li>建议在首次运行系统时执行此操作。</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">执行步骤</h3>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      step.status === 'success' ? "bg-green-100 text-green-600" :
                        step.status === 'loading' ? "bg-blue-100 text-blue-600 animate-pulse" :
                          step.status === 'error' ? "bg-red-100 text-red-600" :
                            "bg-neutral-100 text-neutral-400"
                    )}>
                      {step.status === 'success' ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : step.status === 'error' ? (
                        <ExclamationCircleIcon className="w-5 h-5" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.name}</p>
                      {step.message && <p className="text-xs text-red-500 mt-0.5">{step.message}</p>}
                    </div>
                  </div>
                  {step.status === 'loading' && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
            onClick={handleInstall}
            disabled={checking || installing || (isInstalled && !installing && steps.every(s => s.status === 'success'))}
          >
            {checking ? '正在检查安装状态...' :
              installing ? '正在初始化系统...' :
                isInstalled ? '重新初始化系统' : '立即安装并初始化'}
            {!installing && !checking && !isInstalled && <ArrowRightIcon className="ml-2 w-5 h-5" />}
          </Button>
          <p className="text-center text-xs text-neutral-400">
            迁移文件目录: migrations/*.json
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// 辅助函数
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
