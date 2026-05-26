import { type ReactNode } from 'react';
import { StaffSidebar } from '@/components/layout/StaffSidebar';

interface StaffLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export function StaffLayout({ children, isAdmin }: StaffLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <StaffSidebar isAdmin={isAdmin} />
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
