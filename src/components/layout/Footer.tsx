import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn(
      "py-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-950/40 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
        <p>
          &copy; {currentYear} <span className="font-semibold text-neutral-900 dark:text-neutral-50">Pocket Stack</span>. All rights reserved.
        </p>
        <span className="hidden md:inline-block text-neutral-300 dark:text-neutral-700">|</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-blue-600 transition-colors">隐私政策</a>
          <a href="#" className="hover:text-blue-600 transition-colors">服务条款</a>
          <a href="#" className="hover:text-blue-600 transition-colors">联系我们</a>
        </div>
      </div>
    </footer>
  );
}
