import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem } from '@/types/types';
import { MENU_CATEGORIES } from '@/types/types';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChefHat, Clock, ShoppingBag, AlertCircle, CalendarClock, Plus, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/timeSlots';
import { toast } from 'sonner';
import { tenantConfig } from '@/config/tenantConfig';

const DIETARY_COLORS: Record<string, string> = {
  vegetarian: 'bg-green-100 text-green-700 border-green-200',
  vegan: 'bg-green-100 text-green-800 border-green-200',
  'gluten-free': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  spicy: 'bg-red-100 text-red-700 border-red-200',
  halal: 'bg-blue-100 text-blue-700 border-blue-200',
};

function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const isSoldOut = !item.available || item.remaining <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut) return;
    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      modifications: '',
      image_url: item.image_url,
      unit_price: item.price,
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <div
      className={`premium-card overflow-hidden h-full flex flex-col transition-all duration-300 ${
        isSoldOut ? 'opacity-60 cursor-default hover:translate-y-0 hover:shadow-card' : 'cursor-pointer'
      }`}
      onClick={() => !isSoldOut && navigate(`/menu/${item.id}`)}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${
              isSoldOut ? 'grayscale' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/35">
            <ChefHat size={32} className="text-primary/70 animate-pulse" />
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
            <span className="bg-destructive text-white text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full shadow-lg">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-bold text-sm text-foreground tracking-tight line-clamp-1">{item.name}</h3>
        {item.description && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        {/* Rating */}
        {item.review_count > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Star size={11} className="fill-primary text-primary" />
            <span className="text-[10px] text-muted-foreground font-semibold">
              {Number(item.average_rating).toFixed(1)} ({item.review_count} reviews)
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {item.dietary_tags.slice(0, 2).map(tag => (
            <span key={tag} className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${DIETARY_COLORS[tag] || 'bg-muted text-muted-foreground border-border'}`}>
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/50">
          <span className="font-extrabold text-primary text-base tracking-tight">{formatCurrency(item.price)}</span>
          <button
            onClick={handleQuickAdd}
            disabled={isSoldOut}
            className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItemSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-8 w-16 mt-1" />
      </div>
    </div>
  );
}

export default function Home() {
  const { settings, isOpen, loading: settingsLoading } = useRestaurant();
  const { profile } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const navigate = useNavigate();
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Live menu subscription
    const channel = supabase
      .channel('menu-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenu();
      })
      .subscribe();

    fetchMenu();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMenu = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });
    setMenuItems(Array.isArray(data) ? (data as MenuItem[]) : []);
    setMenuLoading(false);
  };

  const categories = ['All', ...MENU_CATEGORIES.filter(c => menuItems.some(i => i.category === c))];
  const filtered = activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  if (settingsLoading) {
    return (
      <CustomerLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <MenuItemSkeleton key={i} />)}
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' }}>
              <ChefHat size={17} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-black text-foreground text-sm tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{tenantConfig.appName}</h1>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{isOpen ? 'Open Now' : 'Closed'}</span>
              </div>
            </div>
          </div>
          {profile && (
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <span className="text-xs font-bold text-foreground">Hi, {profile.name?.split(' ')[0] || 'there'}</span>
              <span className="text-sm">👋</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Status Banner */}
        {isOpen ? (
          <div
            className="rounded-3xl p-5 flex items-center gap-4 cursor-pointer transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' }}
            onClick={() => navigate('/menu')}
          >
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 right-10 w-16 h-16 rounded-full bg-white/5" />
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
              <ShoppingBag size={22} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white text-base tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>We're cooking! 🔥</p>
              <p className="text-white/80 text-xs mt-0.5 font-medium">Fresh meals ready in ~{settings?.prep_time_estimate_minutes ?? 15} mins</p>
            </div>
            <div className="text-white/60 text-lg">›</div>
          </div>
        ) : (
          <div className="rounded-3xl p-5 bg-muted border border-border">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm">{tenantConfig.appName} is closed for today – thank you! 🍔</p>
                <p className="text-muted-foreground text-xs mt-1 text-pretty">
                  {settings?.custom_closed_message || 'We will be back soon!'}
                </p>
                <Button
                  size="sm"
                  className="mt-3 h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={() => navigate('/preorder')}
                >
                  <CalendarClock size={14} />
                  Pre-order for Tomorrow
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Today's hours */}
        {isOpen && settings && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>
              Open today until {(() => {
                const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                const day = days[new Date().getDay()] as keyof typeof settings.opening_hours;
                const close = settings.opening_hours[day]?.close;
                if (!close) return '—';
                const [h, m] = close.split(':').map(Number);
                const date = new Date();
                date.setHours(h, m);
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              })()}
            </span>
          </div>
        )}

        {/* Category pills */}
        {!menuLoading && categories.length > 1 && (
          <div
            ref={categoryRef}
            className="flex gap-2 overflow-x-auto pb-1 whitespace-nowrap"
            style={{ scrollbarWidth: 'none' }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 shrink-0 ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Menu grid */}
        {menuLoading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {[...Array(6)].map((_, i) => <MenuItemSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-muted flex items-center justify-center mb-4">
              <ChefHat size={36} className="text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">No items available right now</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Check back soon for fresh arrivals</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 pb-4">
            {filtered.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
