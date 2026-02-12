import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/use-settings";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  const { siteName } = useSettings();

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src="/logo.svg" alt="Logo" className="h-9 w-9 drop-shadow-lg drop-shadow-blue-500/20" />
      {showText && (
        <span
          className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50"
          dangerouslySetInnerHTML={{ __html: siteName || 'Pocket <span class="text-blue-600">Stack</span>' }}
        />
      )}
    </div>
  );
}
