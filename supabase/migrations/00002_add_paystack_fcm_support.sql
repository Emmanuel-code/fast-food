-- Add Paystack payment fields to orders table
ALTER TABLE public.orders
  ADD COLUMN payment_method text NOT NULL DEFAULT 'cash',
  ADD COLUMN paystack_reference text,
  ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid';

CREATE UNIQUE INDEX idx_orders_paystack_reference
  ON public.orders (paystack_reference)
  WHERE paystack_reference IS NOT NULL;

CREATE INDEX idx_orders_payment_status ON public.orders (payment_status);

-- FCM tokens table for push notifications
CREATE TABLE public.fcm_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own FCM tokens
CREATE POLICY "Users can insert own fcm tokens"
  ON public.fcm_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own fcm tokens"
  ON public.fcm_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fcm tokens"
  ON public.fcm_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for orders (already enabled, but ensure it's present)
ALTER PUBLICATION supabase_realtime ADD TABLE public.fcm_tokens;