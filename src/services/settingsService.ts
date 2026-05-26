import { supabase } from '@/db/supabase';
import type { RestaurantSettings } from '@/types/types';

export async function getSettings(): Promise<RestaurantSettings | null> {
  const { data, error } = await supabase
    .from('restaurant_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data as RestaurantSettings | null;
}

export async function updateSettings(updates: Partial<RestaurantSettings>): Promise<void> {
  const { error } = await supabase
    .from('restaurant_settings')
    .update(updates)
    .eq('id', 1);
  if (error) throw error;
}

export async function closeKitchen(message?: string): Promise<void> {
  const updates: Partial<RestaurantSettings> = { closed_temporarily: true };
  if (message) updates.custom_closed_message = message;
  await updateSettings(updates);
}

export async function openKitchen(): Promise<void> {
  await updateSettings({ closed_temporarily: false });
}
