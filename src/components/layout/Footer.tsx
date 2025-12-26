import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { GithubIcon } from '@hugeicons/core-free-icons';
import { useSettings } from '@/lib/use-settings';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const { footerText } = useSettings();

  return (
    <footer className={cn(
      "py-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-950/40 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
        <div className="flex items-center gap-2">
          <p dangerouslySetInnerHTML={{ __html: footerText || `&copy; ${new Date().getFullYear()} <strong>Pocket Stack</strong>. All rights reserved.` }} />
          <a
            href="https://github.com/citywill/pocket-stack"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="GitHub Repository"
          >
            <HugeiconsIcon icon={GithubIcon} className="w-4 h-4" />
          </a>
        </div>
        <span className="hidden md:inline-block text-neutral-300 dark:text-neutral-700">|</span>
        <div className="flex items-center gap-4">
          <a href="https://citywill.github.io/pocket-stack/" className="hover:text-blue-600 transition-colors">说明文档</a>
        </div>
      </div>
    </footer>
  );
}
