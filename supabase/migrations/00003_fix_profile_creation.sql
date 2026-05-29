-- Fix: Allow authenticated users to create their own profile row.
-- The trigger `on_auth_user_created` SHOULD handle this, but if it didn't fire
-- (e.g. migration applied after users were already created), we need a fallback.

-- 1. Add INSERT policy so users can create their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. RPC function: ensure_profile
-- Called from the frontend when profile is missing.
-- Uses SECURITY DEFINER so it bypasses RLS, guaranteeing the row is created.
CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_user_id UUID,
  p_email TEXT DEFAULT '',
  p_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Only allow users to create their own profile
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Upsert: insert if missing, do nothing if exists
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (p_user_id, p_email, p_name, 'customer'::public.user_role)
  ON CONFLICT (id) DO NOTHING;

  -- Return the profile
  SELECT to_jsonb(p.*) INTO result
  FROM public.profiles p
  WHERE p.id = p_user_id;

  RETURN result;
END;
$$;
