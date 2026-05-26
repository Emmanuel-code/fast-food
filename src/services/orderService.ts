import { supabase } from '@/db/supabase';
import type { Order, OrderStatus } from '@/types/types';

export async function createOrder(order: Omit<Order, 'id' | 'order_number' | 'updated_at'>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Order;
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles!orders_user_id_fkey(name, email)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return Array.isArray(data) ? (data as Order[]) : [];
}

export async function getAllOrders(filters?: {
  status?: OrderStatus;
  search?: string;
  date?: string;
}): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*, profiles!orders_user_id_fkey(name, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.date) {
    query = query
      .gte('created_at', `${filters.date}T00:00:00`)
      .lte('created_at', `${filters.date}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;

  let orders = Array.isArray(data) ? (data as Order[]) : [];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    orders = orders.filter(o =>
      o.order_number?.toLowerCase().includes(s) ||
      (o.profiles as { name: string | null; email: string | null } | undefined)?.name?.toLowerCase().includes(s) ||
      (o.profiles as { name: string | null; email: string | null } | undefined)?.email?.toLowerCase().includes(s)
    );
  }

  return orders;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function updateKitchenNote(id: string, kitchen_note: string): Promise<void> {
  const { error } = await supabase.from('orders').update({ kitchen_note }).eq('id', id);
  if (error) throw error;
}

export async function toggleOrderFavorite(id: string, is_favorite: boolean): Promise<void> {
  const { error } = await supabase.from('orders').update({ is_favorite }).eq('id', id);
  if (error) throw error;
}

export async function countOrdersForSlot(
  scheduledDate: string,
  scheduledTime: string
): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('is_asap', false)
    .gte('scheduled_time', `${scheduledDate}T${scheduledTime}:00`)
    .lt('scheduled_time', `${scheduledDate}T${scheduledTime}:59`)
    .not('status', 'eq', 'cancelled');

  if (error) throw error;
  return count ?? 0;
}

export async function getTodayStats(): Promise<{
  orderCount: number;
  revenue: number;
  popularItems: { name: string; count: number }[];
}> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('orders')
    .select('total, items')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)
    .not('status', 'eq', 'cancelled');

  if (error) throw error;

  const orders = Array.isArray(data) ? data : [];
  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const itemCounts: Record<string, number> = {};
  orders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: { name: string; qty: number }) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });

  const popularItems = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { orderCount: orders.length, revenue, popularItems };
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
  ordersCount: number;
}

export interface TopItem {
  name: string;
  count: number;
  revenue: number;
}

export interface PeakHour {
  hour: number;
  label: string;
  count: number;
  orders: number;
}

export interface TypeBreakdown {
  type: string;
  count: number;
  orders: number;
  revenue: number;
}

export interface AnalyticsData {
  daily: DailyRevenue[];
  topItems: TopItem[];
  peakHours: PeakHour[];
  typeBreakdown: TypeBreakdown[];
}

export async function getAnalytics(days: number = 7): Promise<AnalyticsData> {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total, items, type')
    .gte('created_at', dateLimit.toISOString())
    .not('status', 'eq', 'cancelled');

  if (error) throw error;
  const orders = Array.isArray(data) ? data : [];

  // 1. Compute Daily Revenue
  const dailyMap: Record<string, { revenue: number; count: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap[dateStr] = { revenue: 0, count: 0 };
  }

  orders.forEach(o => {
    const dateStr = new Date(o.created_at).toISOString().split('T')[0];
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].revenue += Number(o.total || 0);
      dailyMap[dateStr].count += 1;
    } else {
      dailyMap[dateStr] = { revenue: Number(o.total || 0), count: 1 };
    }
  });

  const dailyRevenue: DailyRevenue[] = Object.entries(dailyMap)
    .map(([date, val]) => ({
      date,
      revenue: Math.round(val.revenue * 100) / 100,
      orders: val.count,
      ordersCount: val.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. Compute Top Items
  const itemsMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: any) => {
      const name = item.name || 'Unknown';
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      if (!itemsMap[name]) {
        itemsMap[name] = { count: 0, revenue: 0 };
      }
      itemsMap[name].count += qty;
      itemsMap[name].revenue += price;
    });
  });

  const topItems: TopItem[] = Object.entries(itemsMap)
    .map(([name, val]) => ({
      name,
      count: val.count,
      revenue: Math.round(val.revenue * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 3. Compute Peak Hours
  const hoursMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) {
    hoursMap[h] = 0;
  }
  orders.forEach(o => {
    const hour = new Date(o.created_at).getHours();
    hoursMap[hour] = (hoursMap[hour] || 0) + 1;
  });

  const peakHours: PeakHour[] = Object.entries(hoursMap)
    .map(([hStr, count]) => {
      const h = Number(hStr);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return {
        hour: h,
        label: `${displayHour} ${ampm}`,
        count,
        orders: count,
      };
    })
    .sort((a, b) => a.hour - b.hour);

  // 4. Compute Type Breakdown
  const typeMap: Record<string, { count: number; revenue: number }> = {
    pickup: { count: 0, revenue: 0 },
    delivery: { count: 0, revenue: 0 },
    curbside: { count: 0, revenue: 0 },
  };
  orders.forEach(o => {
    const type = o.type || 'pickup';
    if (!typeMap[type]) {
      typeMap[type] = { count: 0, revenue: 0 };
    }
    typeMap[type].count += 1;
    typeMap[type].revenue += Number(o.total || 0);
  });

  const typeBreakdown: TypeBreakdown[] = Object.entries(typeMap).map(([type, val]) => ({
    type,
    count: val.count,
    orders: val.count,
    revenue: Math.round(val.revenue * 100) / 100,
  }));

  return {
    daily: dailyRevenue,
    topItems,
    peakHours,
    typeBreakdown,
  };
}
