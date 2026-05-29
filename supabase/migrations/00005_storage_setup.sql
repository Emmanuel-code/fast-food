-- Create the menu-images storage bucket (public so images are accessible to customers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880,  -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Allow managers and admins to upload images
CREATE POLICY "Managers can upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin')
    )
  );

-- RLS: Allow managers and admins to update/replace images
CREATE POLICY "Managers can update menu images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin')
    )
  );

-- RLS: Allow managers and admins to delete images
CREATE POLICY "Managers can delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin')
    )
  );

-- RLS: Allow anyone (including unauthenticated) to view menu images
CREATE POLICY "Anyone can view menu images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'menu-images');
