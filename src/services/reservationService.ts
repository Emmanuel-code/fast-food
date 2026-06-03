import { supabase } from '@/db/supabase';
import type { Reservation, ReservationStatus } from '@/types/types';

export const reservationService = {
  async getReservations(date?: string) {
    let query = supabase
      .from('reservations')
      .select('*')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true });

    if (date) {
      query = query.eq('reservation_date', date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Reservation[];
  },

  async createReservation(reservationData: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
      .single();

    if (error) throw error;
    return data as Reservation;
  },

  async updateReservationStatus(id: string, status: ReservationStatus) {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Reservation;
  },

  // Check how many reservations are confirmed for a specific date and time slot
  async getConfirmedReservationsCount(date: string, time: string) {
    const { count, error } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .eq('status', 'confirmed');

    if (error) throw error;
    return count || 0;
  }
};
