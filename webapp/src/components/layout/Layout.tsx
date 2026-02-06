import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TimeTrackingFooter from './TimeTrackingFooter';

interface LayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export default function Layout({ children, rightPanel }: LayoutProps) {
  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <TimeTrackingFooter />
      </main>

      {rightPanel && (
        <aside className="w-80 border-l border-light-text-secondary/10 dark:border-dark-border bg-light-card dark:bg-dark-card overflow-y-auto">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
