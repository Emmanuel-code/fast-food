import { supabase } from '@/db/supabase';
import type { AppNotification } from '@/types/types';
import { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionCallback = (notification: AppNotification) => void;

export const notificationService = {
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data as AppNotification[];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  subscribe(userId: string, callback: SubscriptionCallback): RealtimeChannel {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          callback(payload.new as AppNotification);
        }
      )
      .subscribe();

    return channel;
  },

  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  }
};
