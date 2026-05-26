import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, ClipboardList, MapPin, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/menu', icon: Home, label: 'Menu' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/location', icon: MapPin, label: 'Find Us' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-12 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <div className="relative">
              <Icon size={22} strokeWidth={1.75} />
              {label === 'Cart' && itemCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  onClick={() => navigate('/cart')}
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
