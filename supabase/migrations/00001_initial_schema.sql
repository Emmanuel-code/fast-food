
-- Create enums
CREATE TYPE public.user_role AS ENUM ('customer', 'worker', 'manager', 'admin');
CREATE TYPE public.order_type AS ENUM ('pickup', 'delivery', 'curbside');
CREATE TYPE public.order_status AS ENUM ('new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled');

-- Profiles table (synced from auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  disabled BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  fcm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-sync new users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'customer'::public.user_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Helper function for role checking
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- Restaurant settings table
CREATE TABLE public.restaurant_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  opening_hours JSONB NOT NULL DEFAULT '{
    "monday": {"open": "08:00", "close": "22:00", "enabled": true},
    "tuesday": {"open": "08:00", "close": "22:00", "enabled": true},
    "wednesday": {"open": "08:00", "close": "22:00", "enabled": true},
    "thursday": {"open": "08:00", "close": "22:00", "enabled": true},
    "friday": {"open": "08:00", "close": "23:00", "enabled": true},
    "saturday": {"open": "09:00", "close": "23:00", "enabled": true},
    "sunday": {"open": "10:00", "close": "21:00", "enabled": true}
  }'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  closed_temporarily BOOLEAN NOT NULL DEFAULT false,
  custom_closed_message TEXT NOT NULL DEFAULT 'We will be back soon! Thank you for your patience.',
  max_pre_order_days INTEGER NOT NULL DEFAULT 2,
  max_orders_per_slot INTEGER NOT NULL DEFAULT 10,
  delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_radius_km NUMERIC NOT NULL DEFAULT 10,
  delivery_fee NUMERIC NOT NULL DEFAULT 3.99,
  prep_time_estimate_minutes INTEGER NOT NULL DEFAULT 15,
  order_alert_threshold_minutes INTEGER NOT NULL DEFAULT 8,
  tax_rate NUMERIC NOT NULL DEFAULT 0.08,
  restaurant_address TEXT NOT NULL DEFAULT '123 Main Street, New York, NY 10001',
  restaurant_lat NUMERIC NOT NULL DEFAULT 40.7128,
  restaurant_lng NUMERIC NOT NULL DEFAULT -74.0060,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO public.restaurant_settings (id) VALUES (1);

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Burgers',
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  available BOOLEAN NOT NULL DEFAULT true,
  limited_stock INTEGER,
  remaining INTEGER NOT NULL DEFAULT 999,
  is_combo BOOLEAN NOT NULL DEFAULT false,
  combo_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  customizations JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  tip NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  type order_type NOT NULL DEFAULT 'pickup',
  status order_status NOT NULL DEFAULT 'new',
  scheduled_time TIMESTAMPTZ,
  customer_note TEXT NOT NULL DEFAULT '',
  kitchen_note TEXT NOT NULL DEFAULT '',
  delivery_address JSONB,
  curbside_vehicle TEXT NOT NULL DEFAULT '',
  is_asap BOOLEAN NOT NULL DEFAULT true,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.order_number := 'CK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Managers can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'manager'::user_role);

CREATE POLICY "Managers can update worker profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) = 'manager'::user_role AND role = 'worker'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'manager'::user_role);

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

-- Menu items policies
CREATE POLICY "Anyone can read available menu items" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Admin and manager can manage menu items" ON menu_items
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin'::user_role, 'manager'::user_role));

-- Orders policies
CREATE POLICY "Customers can create own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND get_user_role(auth.uid()) = 'customer'::user_role);

CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND get_user_role(auth.uid()) = 'customer'::user_role);

CREATE POLICY "Staff can view all orders" ON orders
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('worker'::user_role, 'manager'::user_role, 'admin'::user_role));

CREATE POLICY "Staff can update order status and kitchen note" ON orders
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('worker'::user_role, 'manager'::user_role, 'admin'::user_role));

CREATE POLICY "Customers can update their own order favorite" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND get_user_role(auth.uid()) = 'customer'::user_role);

-- Restaurant settings policies
CREATE POLICY "Authenticated users can read settings" ON restaurant_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon users can read settings" ON restaurant_settings
  FOR SELECT TO anon USING (true);

CREATE POLICY "Admin and manager can update settings" ON restaurant_settings
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin'::user_role, 'manager'::user_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_settings;

-- Public view for shared profile info
CREATE VIEW public_profiles AS
  SELECT id, name, role FROM profiles;
