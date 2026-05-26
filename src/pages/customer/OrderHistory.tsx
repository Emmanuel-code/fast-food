import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getMyOrders } from '@/services/orderService';
import { toggleOrderFavorite } from '@/services/orderService';
import { useCart } from '@/contexts/CartContext';
import type { Order } from '@/types/types';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star, RotateCcw, ClipboardList } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/timeSlots';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RatingModal } from '@/components/common/RatingModal';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  accepted: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function OrderHistory() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getMyOrders(user.id).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, [user]);

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      addItem({
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        modifications: item.modifications,
        image_url: '',
        unit_price: item.price / item.qty,
      });
    });
    toast.success('Items added to cart!');
    navigate('/cart');
  };

  const handleToggleFav = async (order: Order) => {
    try {
      await toggleOrderFavorite(order.id, !order.is_favorite);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_favorite: !o.is_favorite } : o));
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleRateDone = (orderId: string) => {
    setReviewedIds(prev => new Set([...prev, orderId]));
    setRatingOrder(null);
  };

  if (!user) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <p className="text-muted-foreground">Please sign in to see your orders</p>
          <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold text-foreground">My Orders</h1>
      </div>

      <div className="px-4 pb-8 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No orders yet</p>
            <Button size="sm" className="mt-4 bg-primary text-primary-foreground" onClick={() => navigate('/menu')}>
              Order Now
            </Button>
          </div>
        ) : (
          orders.map(order => (
            <div
              key={order.id}
              className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium capitalize', STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground')}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {order.items.slice(0, 2).map(i => i.name).join(', ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleFav(order); }}
                    className="p-1.5"
                  >
                    <Star
                      size={16}
                      className={order.is_favorite ? 'fill-primary text-primary' : 'text-muted-foreground'}
                    />
                  </button>
                  <span className="font-bold text-sm text-primary">{formatCurrency(order.total)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground capitalize">{order.type} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-3">
                  {order.status === 'completed' && !reviewedIds.has(order.id) && (
                    <button
                      onClick={e => { e.stopPropagation(); setRatingOrder(order); }}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <Star size={11} />
                      Rate
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleReorder(order); }}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <RotateCcw size={11} />
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {ratingOrder && user && (
        <RatingModal
          orderId={ratingOrder.id}
          userId={user.id}
          items={ratingOrder.items.map(i => ({ menu_item_id: i.menu_item_id, name: i.name }))}
          onClose={() => setRatingOrder(null)}
          onDone={() => handleRateDone(ratingOrder.id)}
        />
      )}
    </CustomerLayout>
  );
}
