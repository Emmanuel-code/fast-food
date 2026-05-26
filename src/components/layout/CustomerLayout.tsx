import { type ReactNode } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';

interface CustomerLayoutProps {
  children: ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 min-w-0 pb-16 max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
