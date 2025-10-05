-- Supabase Storage configuration for Campaign Management
-- This file sets up storage buckets and policies for campaign images

-- 1. Create storage buckets for campaign images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('hero-slider-images', 'hero-slider-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('fixed-banner-images', 'fixed-banner-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('popup-campaign-images', 'popup-campaign-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies for hero slider images
-- Allow public read access to all hero slider images
CREATE POLICY "Public read access for hero slider images" ON storage.objects
  FOR SELECT USING (bucket_id = 'hero-slider-images');

-- Allow authenticated users with admin/marketing role to upload hero slider images
CREATE POLICY "Admin/Marketing can upload hero slider images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hero-slider-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- Allow admin/marketing to update hero slider images they uploaded
CREATE POLICY "Admin/Marketing can update their hero slider images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'hero-slider-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- Allow admin/marketing to delete hero slider images
CREATE POLICY "Admin/Marketing can delete hero slider images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'hero-slider-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- 3. Storage policies for fixed banner images
-- Allow public read access to all fixed banner images
CREATE POLICY "Public read access for fixed banner images" ON storage.objects
  FOR SELECT USING (bucket_id = 'fixed-banner-images');

-- Allow authenticated users with admin/marketing role to upload fixed banner images
CREATE POLICY "Admin/Marketing can upload fixed banner images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fixed-banner-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- Allow admin/marketing to update fixed banner images
CREATE POLICY "Admin/Marketing can update their fixed banner images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'fixed-banner-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- Allow admin/marketing to delete fixed banner images
CREATE POLICY "Admin/Marketing can delete fixed banner images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fixed-banner-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- 4. Storage policies for popup campaign images
-- Allow public read access to all popup campaign images
CREATE POLICY "Public read access for popup campaign images" ON storage.objects
  FOR SELECT USING (bucket_id = 'popup-campaign-images');

-- Allow authenticated users with admin/marketing role to upload popup campaign images
CREATE POLICY "Admin/Marketing can upload popup campaign images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'popup-campaign-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- Allow admin/marketing to update popup campaign images
CREATE POLICY "Admin/Marketing can update their popup campaign images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'popup-campaign-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- Allow admin/marketing to delete popup campaign images
CREATE POLICY "Admin/Marketing can delete popup campaign images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'popup-campaign-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'marketing')
    )
  );

-- 5. Helper function to generate storage URLs
CREATE OR REPLACE FUNCTION get_campaign_image_url(bucket_name TEXT, image_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the full public URL for the image
  RETURN 'https://' || current_setting('app.supabase_project_ref') || '.supabase.co/storage/v1/object/public/' || bucket_name || '/' || image_path;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 6. Function to clean up unused images (optional maintenance function)
CREATE OR REPLACE FUNCTION cleanup_unused_campaign_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- Clean up hero slider images not referenced in the table
  DELETE FROM storage.objects 
  WHERE bucket_id = 'hero-slider-images' 
  AND name NOT IN (
    SELECT REPLACE(image_url, 'https://' || current_setting('app.supabase_project_ref') || '.supabase.co/storage/v1/object/public/hero-slider-images/', '')
    FROM hero_image_sliders 
    WHERE image_url IS NOT NULL
  );
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Clean up fixed banner images not referenced in the table
  DELETE FROM storage.objects 
  WHERE bucket_id = 'fixed-banner-images' 
  AND name NOT IN (
    SELECT REPLACE(image_url, 'https://' || current_setting('app.supabase_project_ref') || '.supabase.co/storage/v1/object/public/fixed-banner-images/', '')
    FROM fixed_banners 
    WHERE image_url IS NOT NULL
  );
  
  -- Clean up popup campaign images not referenced in the table
  DELETE FROM storage.objects 
  WHERE bucket_id = 'popup-campaign-images' 
  AND name NOT IN (
    SELECT REPLACE(image_url, 'https://' || current_setting('app.supabase_project_ref') || '.supabase.co/storage/v1/object/public/popup-campaign-images/', '')
    FROM popup_campaigns 
    WHERE image_url IS NOT NULL
  );
  
  RETURN cleanup_count;
END;
$$;