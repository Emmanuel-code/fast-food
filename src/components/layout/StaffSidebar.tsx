import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList,
  Users, Settings, LogOut, ChefHat, Menu as MenuIcon, Tag
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface StaffSidebarProps {
  isAdmin?: boolean;
}

const managerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menu Manager' },
  { to: '/dashboard/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/dashboard/promos', icon: Tag, label: 'Promo Codes' },
  { to: '/dashboard/staff', icon: Users, label: 'Staff' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

import { tenantConfig } from '@/config/tenantConfig';
import { NotificationInbox } from '@/components/NotificationInbox';

function SidebarContent({ onClose }: { isAdmin?: boolean; onClose?: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <ChefHat size={20} className="text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sidebar-foreground text-sm truncate">{tenantConfig.appName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0 capitalize">
                {profile?.role}
              </Badge>
            </div>
          </div>
          <div className="flex-shrink-0">
            <NotificationInbox />
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-2 truncate">{profile?.name || profile?.email}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {managerNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-12',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-h-12"
          onClick={handleSignOut}
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function StaffSidebar({ isAdmin }: StaffSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent isAdmin={isAdmin} />
      </aside>

      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-card border border-border shadow-sm"
          >
            <MenuIcon size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <SidebarContent isAdmin={isAdmin} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
