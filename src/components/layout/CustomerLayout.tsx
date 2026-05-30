import { type ReactNode } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { NotificationInbox } from '@/components/NotificationInbox';
import { tenantConfig } from '@/config/tenantConfig';
import { ChefHat } from 'lucide-react';

interface CustomerLayoutProps {
  children: ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-background/95 backdrop-blur border-b border-border max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <ChefHat size={16} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">{tenantConfig.appName}</span>
        </div>
        <NotificationInbox />
      </header>
      <main className="flex-1 min-w-0 pb-16 max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
