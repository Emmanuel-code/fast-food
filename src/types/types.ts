export type UserRole = 'customer' | 'worker' | 'manager' | 'admin';
export type OrderType = 'pickup' | 'delivery' | 'curbside';
export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  disabled: boolean;
  phone: string | null;
  addresses: SavedAddress[];
  fcm_token: string | null;
  created_at: string;
}

export interface SavedAddress {
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface CustomizationOption {
  label: string;
  price_adj: number;
}

export interface Customization {
  name: string;
  options: CustomizationOption[];
}

export interface ComboItem {
  menu_item_id: string;
  qty: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  category: string;
  dietary_tags: string[];
  available: boolean;
  limited_stock: number | null;
  remaining: number;
  is_combo: boolean;
  combo_items: ComboItem[];
  customizations: Customization[];
  sort_order: number;
  average_rating: number;
  review_count: number;
  created_at: string;
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  qty: number;
  modifications: string;
  image_url: string;
  unit_price: number;
}

export interface DeliveryAddress {
  lat?: number;
  lng?: number;
  details?: string;
  line1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  qty: number;
  modifications: string;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  tip: number;
  total: number;
  type: OrderType;
  status: OrderStatus;
  scheduled_time: string | null;
  customer_note: string;
  kitchen_note: string;
  delivery_address: DeliveryAddress | null;
  curbside_vehicle: string;
  is_asap: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { name: string | null; email: string | null };
}

export interface DayHours {
  open: string;
  close: string;
  enabled: boolean;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface RestaurantSettings {
  id: 1;
  opening_hours: OpeningHours;
  timezone: string;
  closed_temporarily: boolean;
  custom_closed_message: string;
  max_pre_order_days: number;
  max_orders_per_slot: number;
  delivery_enabled: boolean;
  delivery_radius_km: number;
  delivery_fee: number;
  prep_time_estimate_minutes: number;
  order_alert_threshold_minutes: number;
  tax_rate: number;
  restaurant_address: string;
  restaurant_lat: number;
  restaurant_lng: number;
}

export const MENU_CATEGORIES = ['Rice Dishes', 'Local Dishes', 'Pizza', 'Sides', 'Drinks'] as const;
export type MenuCategory = typeof MENU_CATEGORIES[number];

export const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type DayName = typeof DAY_NAMES[number];
