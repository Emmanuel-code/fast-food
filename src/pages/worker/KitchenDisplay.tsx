import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { updateOrderStatus, updateKitchenNote } from '@/services/orderService';
import type { Order, OrderStatus } from '@/types/types';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ChefHat, LogOut, CheckCircle,
  Play, Package, Bell, MessageSquare, AlertTriangle
} from 'lucide-react';
import { elapsedMinutes, elapsedTime } from '@/utils/timeSlots';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLUMNS: { status: OrderStatus | 'new'; label: string; color: string; headerColor: string }[] = [
  { status: 'new', label: 'New Orders', color: 'border-blue-300 bg-blue-50', headerColor: 'bg-blue-500 text-white' },
  { status: 'accepted', label: 'Accepted', color: 'border-yellow-300 bg-yellow-50', headerColor: 'bg-yellow-500 text-white' },
  { status: 'preparing', label: 'Preparing', color: 'border-orange-300 bg-orange-50', headerColor: 'bg-orange-500 text-white' },
  { status: 'ready', label: 'Ready', color: 'border-green-300 bg-green-50', headerColor: 'bg-green-500 text-white' },
  { status: 'completed', label: 'Completed', color: 'border-muted bg-muted/30', headerColor: 'bg-muted text-muted-foreground' },
];

function OrderTimer({ createdAt, threshold }: { createdAt: string; threshold: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = elapsedMinutes(createdAt);
  const time = elapsedTime(createdAt);
  return (
    <span className={cn('flex items-center gap-1 text-xs font-mono font-bold', mins >= threshold ? 'text-destructive' : 'text-muted-foreground')}>
      {mins >= threshold && <AlertTriangle size={11} />}
      {time}
    </span>
  );
}

function OrderCard({
  order,
  threshold,
  onAccept,
  onPreparing,
  onReady,
  onComplete,
  onNote,
}: {
  order: Order;
  threshold: number;
  onAccept: (id: string) => void;
  onPreparing: (id: string) => void;
  onReady: (id: string) => void;
  onComplete: (id: string) => void;
  onNote: (order: Order) => void;
}) {
  const mins = elapsedMinutes(order.created_at);
  const isUrgent = mins >= threshold;

  return (
    <div className={cn(
      'rounded-xl border-2 p-3 shadow-sm transition-all',
      isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-mono text-xs font-bold text-muted-foreground">{order.order_number}</span>
          <p className="font-bold text-sm text-foreground">{(order.profiles as { name: string | null } | undefined)?.name || 'Customer'}</p>
        </div>
        <div className="text-right">
          <OrderTimer createdAt={order.created_at} threshold={threshold} />
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize mt-0.5 inline-block',
            order.type === 'delivery' ? 'bg-blue-100 text-blue-700' :
            order.type === 'curbside' ? 'bg-purple-100 text-purple-700' :
            'bg-green-100 text-green-700'
          )}>
            {order.type}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="text-xs">
            <span className="font-semibold text-foreground">{item.qty}× {item.name}</span>
            {item.modifications && (
              <p className="text-muted-foreground ml-3 italic">{item.modifications}</p>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.customer_note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2 text-xs text-yellow-800">
          📝 {order.customer_note}
        </div>
      )}
      {order.kitchen_note && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 text-xs text-blue-800">
          👨‍🍳 {order.kitchen_note}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 mt-2">
        {order.status === 'new' && (
          <Button
            size="sm"
            onClick={() => onAccept(order.id)}
            className="flex-1 h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1"
          >
            <Play size={11} />
            Accept
          </Button>
        )}
        {order.status === 'accepted' && (
          <Button
            size="sm"
            onClick={() => onPreparing(order.id)}
            className="flex-1 h-8 text-xs bg-yellow-500 hover:bg-yellow-600 text-white gap-1"
          >
            <ChefHat size={11} />
            Preparing
          </Button>
        )}
        {order.status === 'preparing' && (
          <Button
            size="sm"
            onClick={() => onReady(order.id)}
            className="flex-1 h-8 text-xs bg-green-500 hover:bg-green-600 text-white gap-1"
          >
            <Package size={11} />
            Ready
          </Button>
        )}
        {order.status === 'ready' && (
          <Button
            size="sm"
            onClick={() => onComplete(order.id)}
            className="flex-1 h-8 text-xs bg-muted text-muted-foreground hover:bg-muted/80 gap-1"
          >
            <CheckCircle size={11} />
            Complete
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onNote(order)}
          className="h-8 text-xs px-2 gap-1"
        >
          <MessageSquare size={11} />
          Note
        </Button>
      </div>
    </div>
  );
}

export default function KitchenDisplay() {
  const { settings } = useRestaurant();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [noteModal, setNoteModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [, setTick] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderIds = useRef<Set<string>>(new Set());

  const threshold = settings?.order_alert_threshold_minutes ?? 8;

  // Tick every second to refresh timers
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, profiles!orders_user_id_fkey(name, email)')
      .in('status', ['new', 'accepted', 'preparing', 'ready', 'completed'])
      .order('created_at', { ascending: true })
      .limit(100);
    const loaded = Array.isArray(data) ? (data as Order[]) : [];

    // Play sound for new orders
    const newIds = new Set(loaded.filter(o => o.status === 'new').map(o => o.id));
    newIds.forEach(id => {
      if (!prevOrderIds.current.has(id)) {
        audioRef.current?.play().catch(() => {});
      }
    });
    prevOrderIds.current = newIds;

    setOrders(loaded);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const sendNotification = async (orderId: string, newStatus: string) => {
    try {
      await supabase.functions.invoke('send-order-notification', {
        body: { order_id: orderId, new_status: newStatus },
      });
    } catch {
      // Notification failure should never block kitchen workflow
    }
  };

  const handleAccept = async (id: string) => {
    await updateOrderStatus(id, 'accepted');
    await sendNotification(id, 'accepted');
    toast.success('Order accepted');
  };
  const handlePreparing = async (id: string) => {
    await updateOrderStatus(id, 'preparing');
    await sendNotification(id, 'preparing');
    toast.success('Order marked as preparing');
  };
  const handleReady = async (id: string) => {
    await updateOrderStatus(id, 'ready');
    await sendNotification(id, 'ready');
    toast.success('Order marked as ready');
  };
  const handleComplete = async (id: string) => {
    await updateOrderStatus(id, 'completed');
    await sendNotification(id, 'completed');
  };

  const handleOpenNote = (order: Order) => {
    setNoteText(order.kitchen_note || '');
    setNoteModal({ open: true, order });
  };
  const handleSaveNote = async () => {
    if (!noteModal.order) return;
    setSavingNote(true);
    await updateKitchenNote(noteModal.order.id, noteText);
    setSavingNote(false);
    setNoteModal({ open: false, order: null });
    toast.success('Note saved');
    fetchOrders();
  };

  const getColumnOrders = (status: string) => {
    return orders.filter(o => o.status === status);
  };

  const activeCount = orders.filter(o => ['new', 'accepted', 'preparing', 'ready'].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2lEOFqJ0OWbWzY6Zp7c7a1lPi1KhsPmpW1LAC5brcHmrW1MAClHlLrboHlUCStHkLbblntWCy1Pk7jbl3pVCzFTl7jbl3tXCzZXm7rbl3tXCzpbm7rbl3tXCzpbm7rbl3tXCzpbm7rbl3tXCzpbm7rbl3tXCzpbm7rbl3tXCzpbm7rbl3tXCzpbm7rbl3tXCzpbm7rbl3tXCw==" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ChefHat size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-sm">Kitchen Display</h1>
            <p className="text-xs text-sidebar-foreground/60">Chef's Kitchen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1.5 rounded-full">
              <Bell size={13} />
              <span className="text-xs font-bold">{activeCount} active</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground gap-1.5"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 min-w-max h-full">
          {COLUMNS.map(col => {
            const colOrders = getColumnOrders(col.status);
            return (
              <div key={col.status} className={cn('w-72 flex flex-col rounded-2xl border-2 overflow-hidden', col.color)}>
                {/* Column header */}
                <div className={cn('px-4 py-2.5 flex items-center justify-between', col.headerColor)}>
                  <span className="font-bold text-sm">{col.label}</span>
                  <span className="text-sm font-bold opacity-80">{colOrders.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/50 text-xs">No orders</div>
                  ) : (
                    colOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        threshold={threshold}
                        onAccept={handleAccept}
                        onPreparing={handlePreparing}
                        onReady={handleReady}
                        onComplete={handleComplete}
                        onNote={handleOpenNote}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note Modal */}
      {noteModal.open && noteModal.order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-[calc(100%-2rem)] md:max-w-sm">
            <h2 className="font-bold text-foreground mb-1">Add Kitchen Note</h2>
            <p className="text-xs text-muted-foreground mb-3">
              For order {noteModal.order.order_number}
            </p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Type a message to the customer..."
              rows={3}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                onClick={() => setNoteModal({ open: false, order: null })}
                className="flex-1 h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="flex-1 h-10 bg-primary text-primary-foreground"
              >
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
