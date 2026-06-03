import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, ClipboardList, MapPin, User, Calendar } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/menu', icon: Home, label: 'Menu' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/reserve', icon: Calendar, label: 'Book' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-card/85 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative flex items-stretch h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-12 text-[10px] font-bold tracking-wide uppercase transition-all duration-200 relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, hsl(38 100% 50%), hsl(24 95% 45%))' }}
                  />
                )}

                <div className={cn(
                  'relative flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary/12 scale-110' : ''
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  {label === 'Cart' && itemCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center text-primary-foreground"
                      style={{ background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' }}
                      onClick={() => navigate('/cart')}
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
