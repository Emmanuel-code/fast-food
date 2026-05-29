import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { RestaurantSettings } from '@/types/types';
import { isRestaurantOpen } from '@/utils/timeSlots';
import { tenantConfig } from '@/config/tenantConfig';

interface RestaurantContextType {
  settings: RestaurantSettings | null;
  isOpen: boolean;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const DEFAULT_SETTINGS: RestaurantSettings = {
  id: 1,
  opening_hours: {
    monday: { open: '08:00', close: '22:00', enabled: true },
    tuesday: { open: '08:00', close: '22:00', enabled: true },
    wednesday: { open: '08:00', close: '22:00', enabled: true },
    thursday: { open: '08:00', close: '22:00', enabled: true },
    friday: { open: '08:00', close: '23:00', enabled: true },
    saturday: { open: '09:00', close: '23:00', enabled: true },
    sunday: { open: '10:00', close: '21:00', enabled: true },
  },
  timezone: 'Africa/Accra',
  closed_temporarily: false,
  custom_closed_message: 'We will be back soon! Thank you for your patience.',
  max_pre_order_days: 2,
  max_orders_per_slot: 10,
  delivery_enabled: true,
  delivery_radius_km: 10,
  delivery_fee: 3.99,
  prep_time_estimate_minutes: 15,
  order_alert_threshold_minutes: 8,
  tax_rate: 0.08,
  restaurant_address: tenantConfig.location.defaultAddress,
  restaurant_lat: tenantConfig.location.defaultLat,
  restaurant_lng: tenantConfig.location.defaultLng,
};

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) {
      setSettings(DEFAULT_SETTINGS);
    } else {
      setSettings(data as RestaurantSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('restaurant-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'restaurant_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const isOpen = settings ? isRestaurantOpen(settings) : false;

  return (
    <RestaurantContext.Provider value={{ settings, isOpen, loading, refreshSettings: fetchSettings }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant must be used within RestaurantProvider');
  return context;
}
