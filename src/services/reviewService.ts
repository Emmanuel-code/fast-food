import { supabase } from '@/db/supabase';

export interface Review {
  id: string;
  order_id: string;
  user_id: string;
  menu_item_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles?: { name: string | null };
}

export async function submitReview(payload: {
  order_id: string;
  user_id: string;
  menu_item_id: string;
  rating: number;
  review_text: string;
}): Promise<void> {
  const { error } = await supabase.from('reviews').insert(payload);
  if (error) throw error;
}

export async function getReviewsForItem(menu_item_id: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles!reviews_user_id_fkey(name)')
    .eq('menu_item_id', menu_item_id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return Array.isArray(data) ? (data as Review[]) : [];
}

export async function getMyReviewForOrder(
  order_id: string,
  user_id: string
): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', order_id)
    .eq('user_id', user_id);
  if (error) throw error;
  return Array.isArray(data) ? (data as Review[]) : [];
}
