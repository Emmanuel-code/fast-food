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
      className={`bg-card rounded-xl border border-border shadow-card overflow-hidden h-full flex flex-col transition-shadow ${isSoldOut ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-hover'}`}
      onClick={() => !isSoldOut && navigate(`/menu/${item.id}`)}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={`w-full h-full object-cover ${isSoldOut ? 'grayscale' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ChefHat size={32} />
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-destructive text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-foreground text-balance">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 text-pretty">{item.description}</p>
        )}
        {/* Rating */}
        {item.review_count > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="fill-primary text-primary" />
            <span className="text-[11px] text-muted-foreground font-medium">
              {Number(item.average_rating).toFixed(1)} ({item.review_count})
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.dietary_tags.slice(0, 2).map(tag => (
            <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${DIETARY_COLORS[tag] || 'bg-muted text-muted-foreground border-border'}`}>
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-bold text-primary text-sm">{formatCurrency(item.price)}</span>
          <button
            onClick={handleQuickAdd}
            disabled={isSoldOut}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus size={16} />
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
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ChefHat size={16} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm">Chef's Kitchen</h1>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-success' : 'bg-destructive'}`} />
                <span className="text-[11px] text-muted-foreground">{isOpen ? 'Open Now' : 'Closed'}</span>
              </div>
            </div>
          </div>
          {profile && (
            <span className="text-sm text-muted-foreground">
              Hi, {profile.name?.split(' ')[0] || 'there'} 👋
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Status Banner */}
        {isOpen ? (
          <div
            className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            style={{ background: 'var(--gradient-primary)' }}
            onClick={() => navigate('/menu')}
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm">We're cooking! Order now</p>
              <p className="text-white/80 text-xs mt-0.5">Fresh meals ready in ~{settings?.prep_time_estimate_minutes ?? 15} mins</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 bg-muted border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm">Chef's Kitchen is closed for today – thank you! 🍔</p>
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
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors shrink-0 ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Menu grid */}
        {menuLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <MenuItemSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No items available right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {filtered.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
