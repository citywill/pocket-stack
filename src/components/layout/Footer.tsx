import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/use-settings';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

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
            <GithubIcon className="w-4 h-4" />
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
