import { supabase } from '@/db/supabase';
import type { Profile, UserRole } from '@/types/types';

export async function getAllStaff(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['worker', 'manager', 'admin'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? (data as Profile[]) : [];
}

export async function updateProfileRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export async function toggleStaffDisabled(userId: string, disabled: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ disabled }).eq('id', userId);
  if (error) throw error;
}

export async function updateMyProfile(
  userId: string,
  updates: { name?: string; phone?: string; addresses?: unknown[] }
): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}
