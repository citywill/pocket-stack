import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const moduleReadmes = import.meta.glob('/src/modules/*/README.md', { query: '?raw', eager: true }) as Record<string, { default: string }>;
const modulePackages = import.meta.glob('/src/modules/*/package.json', { eager: true }) as Record<string, any>;

export function ModuleReadme() {
  const { moduleName } = useParams<{ moduleName: string }>();
  const navigate = useNavigate();

  const readmePath = `/src/modules/${moduleName}/README.md`;
  const readmeContent = moduleReadmes[readmePath]?.default;

  const pkgPath = `/src/modules/${moduleName}/package.json`;
  const pkg = modulePackages[pkgPath];
  const moduleTitle = pkg?.title || moduleName || '未知模块';

  if (!readmeContent) {
    return (
      <div className="space-y-6 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/modules')}
          className="rounded-xl -ml-3"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回模块列表
        </Button>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DocumentTextIcon className="h-16 w-16 text-neutral-300 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              模块说明不存在
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              模块「{moduleTitle}」尚未编写 README.md 说明文档。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/modules')}
        className="rounded-xl -ml-3"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        返回模块列表
      </Button>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-primary" />
            {moduleTitle} - 模块说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {readmeContent}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
