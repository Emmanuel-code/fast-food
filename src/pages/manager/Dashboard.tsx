import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { getTodayStats, getAnalytics } from '@/services/orderService';
import type { DailyRevenue, TopItem, PeakHour, TypeBreakdown } from '@/services/orderService';
import type { Order } from '@/types/types';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, ShoppingBag, TrendingUp,
  Clock, RefreshCw,
} from 'lucide-react';
import { formatCurrency, elapsedTime } from '@/utils/timeSlots';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  accepted: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

const TYPE_COLORS: Record<string, string> = {
  pickup: '#b45309',
  delivery: '#0284c7',
  curbside: '#7c3aed',
};

const CHART_COLORS = ['#b45309', '#0284c7', '#7c3aed', '#059669', '#dc2626'];

// Format GHS for chart axis
function ghsFormatter(v: number) {
  if (v >= 1000) return `₵${(v / 1000).toFixed(1)}k`;
  return `₵${v}`;
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-4 md:p-5', className)}>
      <h2 className="font-semibold text-sm text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const [stats, setStats] = useState<{ orderCount: number; revenue: number; popularItems: { name: string; count: number }[] } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<{ daily: DailyRevenue[]; topItems: TopItem[]; peakHours: PeakHour[]; typeBreakdown: TypeBreakdown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsRange, setAnalyticsRange] = useState<7 | 14 | 30>(7);

  const loadDashboard = async () => {
    const [s, { data }] = await Promise.all([
      getTodayStats(),
      supabase.from('orders').select('*, profiles!orders_user_id_fkey(name)').order('created_at', { ascending: false }).limit(10),
    ]);
    setStats(s);
    setRecentOrders(Array.isArray(data) ? data as Order[] : []);
    setLoading(false);
  };

  const loadAnalytics = async (days: number) => {
    setAnalyticsLoading(true);
    try {
      const data = await getAnalytics(days);
      setAnalytics(data);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadAnalytics(analyticsRange);

    const channel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadDashboard();
        loadAnalytics(analyticsRange);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleRangeChange = (days: 7 | 14 | 30) => {
    setAnalyticsRange(days);
    loadAnalytics(days);
  };

  // Format date labels for chart (Mon 19, Tue 20 etc.)
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  return (
    <StaffLayout isAdmin={isAdmin}>
      <div className="p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground text-balance">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={loadDashboard} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Today's stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : (
            <>
              <div className="bg-card rounded-xl border border-border p-4 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag size={16} className="text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Orders Today</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.orderCount ?? 0}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <DollarSign size={16} className="text-success" />
                  </div>
                  <span className="text-xs text-muted-foreground">Revenue Today</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.revenue ?? 0)}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 col-span-2 md:col-span-1 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} className="text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Top Item Today</span>
                </div>
                <p className="text-base font-bold text-foreground truncate">{stats?.popularItems?.[0]?.name || '—'}</p>
                {stats?.popularItems?.[0] && (
                  <p className="text-xs text-muted-foreground">{stats.popularItems[0].count} ordered</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Analytics range picker */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Sales Analytics</h2>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {([7, 14, 30] as const).map(d => (
              <button
                key={d}
                onClick={() => handleRangeChange(d)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  analyticsRange === d ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Daily Revenue */}
          <SectionCard title={`Daily Revenue — Last ${analyticsRange} Days`} className="md:col-span-2">
            {analyticsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics?.daily ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 11 }}
                      interval={analyticsRange > 14 ? 3 : 0}
                    />
                    <YAxis tickFormatter={ghsFormatter} tick={{ fontSize: 11 }} width={48} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                      labelFormatter={formatDateLabel}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Top Items */}
          <SectionCard title="Top-Selling Items">
            {analyticsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : !analytics?.topItems?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={analytics.topItems}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={90}
                      tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + '…' : v}
                    />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Qty Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Order Type Breakdown */}
          <SectionCard title="Order Type Breakdown">
            {analyticsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : !analytics?.typeBreakdown?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={analytics.typeBreakdown}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="45%"
                      outerRadius={75}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analytics.typeBreakdown.map((entry, i) => (
                        <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Peak Order Hours */}
          <SectionCard title="Peak Order Hours" className="md:col-span-2">
            {analyticsLoading ? (
              <Skeleton className="h-36 w-full" />
            ) : (
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={(analytics?.peakHours ?? []).filter(h => h.hour >= 7 && h.hour <= 22)}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fontSize: 10 }} width={24} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, 'Orders']} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Recent orders table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm text-foreground">Recent Orders</h2>
            <button onClick={() => navigate('/dashboard/orders')} className="text-xs text-primary hover:text-primary/80">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5 whitespace-nowrap">Order</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5 whitespace-nowrap">Customer</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5 whitespace-nowrap">Status</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2.5 whitespace-nowrap">Total</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2.5 whitespace-nowrap">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>)}
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No orders yet</td></tr>
                ) : (
                  recentOrders.map(order => (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/orders')}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                        {(order.profiles as { name: string | null } | undefined)?.name || 'Customer'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium capitalize', STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground')}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium whitespace-nowrap">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-xs text-right text-muted-foreground whitespace-nowrap flex items-center justify-end gap-1">
                        <Clock size={10} />
                        {elapsedTime(order.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
