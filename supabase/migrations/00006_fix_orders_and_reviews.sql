-- Fix 1: Make curbside_vehicle nullable (it's only used for curbside orders)
ALTER TABLE public.orders
  ALTER COLUMN curbside_vehicle DROP NOT NULL;

-- Fix 2: Make customer_note nullable too (in case it's also NOT NULL)
ALTER TABLE public.orders
  ALTER COLUMN customer_note DROP NOT NULL;

-- Fix 3: Create reviews table (was missing)
CREATE TABLE IF NOT EXISTS public.reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_item_id  uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  order_id      uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating        smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, menu_item_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reviews_menu_item_id ON public.reviews (menu_item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
