import { supabase } from '@/db/supabase';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  expiration_date: string | null;
  active: boolean;
  usage_count: number;
  created_at: string;
}

export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; discount: number; message: string; promo?: PromoCode }> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return { valid: false, discount: 0, message: 'Invalid promo code' };

  const promo = data as PromoCode;

  // Check expiry
  if (promo.expiration_date && new Date(promo.expiration_date) < new Date()) {
    return { valid: false, discount: 0, message: 'This promo code has expired' };
  }

  const discount =
    promo.discount_type === 'percentage'
      ? Math.round((subtotal * (promo.discount_value / 100)) * 100) / 100
      : Math.min(promo.discount_value, subtotal);

  return { valid: true, discount, message: `${promo.discount_type === 'percentage' ? promo.discount_value + '% off' : 'GHS ' + promo.discount_value + ' off'} applied!`, promo };
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? (data as PromoCode[]) : [];
}

export async function createPromoCode(
  payload: Omit<PromoCode, 'id' | 'usage_count' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('promo_codes').insert({
    ...payload,
    code: payload.code.trim().toUpperCase(),
  });
  if (error) throw error;
}

export async function updatePromoCode(id: string, payload: Partial<PromoCode>): Promise<void> {
  const { error } = await supabase.from('promo_codes').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deletePromoCode(id: string): Promise<void> {
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);
  if (error) throw error;
}
