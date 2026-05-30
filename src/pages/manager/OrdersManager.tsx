import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { updateOrderStatus } from '@/services/orderService';
import type { Order, OrderStatus } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronDown, Eye, X, CheckCircle, MapPin, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils/timeSlots';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  accepted: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function OrdersManager() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*, profiles!orders_user_id_fkey(name, email)')
      .order('created_at', { ascending: false })
      .limit(200);

    const { data } = await query;
    setOrders(Array.isArray(data) ? data as Order[] : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('orders-manager')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = orders.filter(o => {
    const matchStatus = activeTab === 'all' || o.status === activeTab || (activeTab === 'preparing' && (o.status === 'accepted' || o.status === 'preparing'));
    const q = search.toLowerCase();
    const matchSearch = !q || o.order_number?.toLowerCase().includes(q) ||
      (o.profiles as { name: string | null; email: string | null } | undefined)?.name?.toLowerCase().includes(q) ||
      (o.profiles as { name: string | null; email: string | null } | undefined)?.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleCancel = async (id: string) => {
    await updateOrderStatus(id, 'cancelled');
    toast.success('Order cancelled');
    fetchOrders();
    setSelectedOrder(null);
  };

  const handleComplete = async (id: string) => {
    await updateOrderStatus(id, 'completed');
    toast.success('Order marked as completed');
    fetchOrders();
    setSelectedOrder(null);
  };

  return (
    <StaffLayout isAdmin={isAdmin}>
      <div className="p-4 md:p-8 lg:pl-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all orders</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4 whitespace-nowrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0',
                activeTab === tab.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Order #</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Customer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Total</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>)}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No orders found</td>
                  </tr>
                ) : (
                  filtered.map(order => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {(order.profiles as { name: string | null } | undefined)?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-muted-foreground whitespace-nowrap">{order.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium capitalize', STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground')}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium whitespace-nowrap">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-xs text-right text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye size={12} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground">Order {selectedOrder.order_number}</h2>
                <p className="text-xs text-muted-foreground">{formatDateTime(selectedOrder.created_at)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize', STATUS_COLORS[selectedOrder.status] || 'bg-muted text-muted-foreground')}>
                  {selectedOrder.status}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">{selectedOrder.type}</span>
                {selectedOrder.is_asap ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">ASAP</span>
                ) : selectedOrder.scheduled_time ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    Scheduled: {formatDateTime(selectedOrder.scheduled_time)}
                  </span>
                ) : null}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Customer</p>
                <p className="text-sm font-medium">{(selectedOrder.profiles as { name: string | null; email: string | null } | undefined)?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">{(selectedOrder.profiles as { name: string | null; email: string | null } | undefined)?.email || ''}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Items</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <div>
                      <span>{item.qty}× {item.name}</span>
                      {item.modifications && <p className="text-xs text-muted-foreground">{item.modifications}</p>}
                    </div>
                    <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(selectedOrder.tax)}</span></div>
                {selectedOrder.delivery_fee > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{formatCurrency(selectedOrder.delivery_fee)}</span></div>}
                <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">{formatCurrency(selectedOrder.total)}</span></div>
              </div>

              {selectedOrder.type === 'delivery' && selectedOrder.delivery_address && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                  <p className="text-xs text-primary font-semibold mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Delivery Location
                  </p>
                  {selectedOrder.delivery_address.lat ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <a 
                          href={`https://maps.google.com/?q=${selectedOrder.delivery_address.lat},${selectedOrder.delivery_address.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                        >
                          View on Map <ExternalLink size={12} />
                        </a>
                      </div>
                      {selectedOrder.delivery_address.details && (
                        <div>
                          <p className="text-xs text-muted-foreground">Special Directions:</p>
                          <p className="font-medium">{selectedOrder.delivery_address.details}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>{selectedOrder.delivery_address.line1}</p>
                      <p>{selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state} {selectedOrder.delivery_address.zip}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.customer_note && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Customer Note</p>
                  {selectedOrder.customer_note}
                </div>
              )}

              {/* Actions */}
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
                    onClick={() => handleCancel(selectedOrder.id)}
                  >
                    <X size={14} />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-success text-white hover:bg-success/90 gap-1"
                    onClick={() => handleComplete(selectedOrder.id)}
                  >
                    <CheckCircle size={14} />
                    Complete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
