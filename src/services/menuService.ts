import { supabase } from '@/db/supabase';
import type { MenuItem } from '@/types/types';

export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as MenuItem[]) : [];
}

export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .gt('remaining', 0)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as MenuItem[]) : [];
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as MenuItem | null;
}

export async function createMenuItem(item: Omit<MenuItem, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('menu_items').insert(item);
  if (error) throw error;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
  const { error } = await supabase.from('menu_items').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleMenuItemAvailability(id: string, available: boolean): Promise<void> {
  const { error } = await supabase.from('menu_items').update({ available }).eq('id', id);
  if (error) throw error;
}

export async function uploadMenuImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `menu/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
  return data.publicUrl;
}
