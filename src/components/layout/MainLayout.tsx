import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-40 h-screen">
        <Sidebar isCollapsed={isCollapsed} />
      </div>

      {/* Mobile Sidebar (Slide-out from under Header) */}
      <div 
        className={cn(
          "lg:hidden fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-64 bg-white transition-transform duration-300 ease-in-out dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 shadow-xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar isCollapsed={false} onItemClick={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-10 bg-black/20 backdrop-blur-[2px] pt-16" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      <Header 
        isCollapsed={isCollapsed} 
        isMobileOpen={isMobileMenuOpen}
        onToggleSidebar={() => setIsCollapsed(!isCollapsed)} 
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      
      <main className={cn(
        "transition-all duration-300 pt-16 min-h-screen",
        // Desktop margins
        isCollapsed ? "lg:ml-20" : "lg:ml-64",
        // Mobile resets (hidden by lg prefixes above)
        "ml-0"
      )}>
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
