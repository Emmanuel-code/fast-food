import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import type { Order, OrderStatus } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle2, ChefHat, Clock, Package, Truck, Star } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils/timeSlots';
import { RatingModal } from '@/components/common/RatingModal';
import { getMyReviewForOrder } from '@/services/reviewService';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'new', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'completed', label: 'Completed', icon: Truck },
];

function getStepIndex(status: OrderStatus): number {
  if (status === 'accepted' || status === 'preparing') return 1;
  if (status === 'ready') return 2;
  if (status === 'completed') return 3;
  if (status === 'cancelled') return -1;
  return 0;
}

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as Order | null);
        setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => { setOrder(payload.new as Order); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Check if already reviewed once order is completed
  useEffect(() => {
    if (!order || order.status !== 'completed' || !user) return;
    getMyReviewForOrder(order.id, user.id).then(reviews => {
      setAlreadyReviewed(reviews.length > 0);
    });
  }, [order?.status, user]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <p className="text-muted-foreground">Order not found</p>
          <Button variant="outline" onClick={() => navigate('/orders')} className="mt-4">View Orders</Button>
        </div>
      </CustomerLayout>
    );
  }

  const stepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <CustomerLayout>
      <div className="px-4 pt-5 pb-3">
        <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} />
          My Orders
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Order Tracking</h1>
          <span className="text-xs font-mono text-muted-foreground">{order.order_number}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Placed {formatDateTime(order.created_at)}
        </p>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Status */}
        {isCancelled ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
            <p className="font-bold text-destructive">Order Cancelled</p>
            <p className="text-xs text-muted-foreground mt-1">This order has been cancelled.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              {STATUS_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const done = i <= stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      active ? 'bg-primary text-primary-foreground shadow-md scale-110' :
                      done ? 'bg-success text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <StepIcon size={16} />
                    </div>
                    <span className={`text-[10px] mt-1 font-medium text-center ${active ? 'text-primary' : done ? 'text-success' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`absolute top-4 left-1/2 w-full h-0.5 ${done ? 'bg-success' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                order.status === 'ready' ? 'bg-green-100 text-green-700' :
                order.status === 'completed' ? 'bg-muted text-muted-foreground' :
                'bg-primary/10 text-primary'
              }`}>
                <Clock size={11} />
                {order.status === 'new' && 'Order received – getting ready to cook!'}
                {(order.status === 'accepted' || order.status === 'preparing') && 'Your order is being prepared 🍳'}
                {order.status === 'ready' && '✅ Your order is ready! Come pick it up!'}
                {order.status === 'completed' && 'Order completed – enjoy your meal!'}
              </span>
            </div>
          </div>
        )}

        {/* Kitchen note / chat */}
        {order.kitchen_note && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message from Kitchen</p>
            <div className="bg-accent/50 border border-border rounded-xl px-4 py-3">
              <p className="text-sm text-foreground">👨‍🍳 {order.kitchen_note}</p>
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Order Details</h2>
            <span className="text-xs text-muted-foreground capitalize">{order.type}</span>
          </div>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div className="min-w-0">
                <span className="text-foreground">{item.qty}x {item.name}</span>
                {item.modifications && (
                  <p className="text-xs text-muted-foreground">{item.modifications}</p>
                )}
              </div>
              <span className="shrink-0 ml-2 text-muted-foreground">{formatCurrency(item.price)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {order.customer_note && (
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Your Note</p>
            <p className="text-sm text-foreground">{order.customer_note}</p>
          </div>
        )}

        {/* Rate order prompt */}
        {order.status === 'completed' && user && !alreadyReviewed && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Enjoyed your meal?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rate and review your items</p>
            </div>
            <Button
              onClick={() => setShowRating(true)}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <Star size={14} />
              Rate Order
            </Button>
          </div>
        )}
        {order.status === 'completed' && alreadyReviewed && (
          <div className="bg-muted/50 rounded-xl border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <Star size={13} className="fill-primary text-primary" />
              Thanks for your review!
            </p>
          </div>
        )}
      </div>

      {showRating && order && user && (
        <RatingModal
          orderId={order.id}
          userId={user.id}
          items={order.items.map(i => ({ menu_item_id: i.menu_item_id, name: i.name }))}
          onClose={() => setShowRating(false)}
          onDone={() => { setShowRating(false); setAlreadyReviewed(true); }}
        />
      )}
    </CustomerLayout>
  );
}
