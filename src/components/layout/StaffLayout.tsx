import { type ReactNode } from 'react';
import { StaffSidebar } from '@/components/layout/StaffSidebar';
import { NotificationInbox } from '@/components/NotificationInbox';

interface StaffLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export function StaffLayout({ children, isAdmin }: StaffLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <StaffSidebar isAdmin={isAdmin} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-end h-14 px-4 bg-background/95 backdrop-blur border-b border-border pl-16">
          <NotificationInbox />
        </header>
        {children}
      </div>
    </div>
  );
}
