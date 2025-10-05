-- Fix Campaign RLS Security Issues
-- This migration fixes critical security problems in campaign management RLS policies

-- ============================================
-- 1. DROP BROKEN RLS POLICIES
-- ============================================

-- Drop existing broken policies (they reference wrong table name)
DROP POLICY IF EXISTS "Allow admin full access to hero sliders" ON hero_slider_items;
DROP POLICY IF EXISTS "Allow admin full access to fixed banners" ON fixed_banners;  
DROP POLICY IF EXISTS "Allow admin full access to popup campaigns" ON popup_campaigns;
DROP POLICY IF EXISTS "Allow marketing access to hero sliders" ON hero_slider_items;
DROP POLICY IF EXISTS "Allow marketing access to fixed banners" ON fixed_banners;
DROP POLICY IF EXISTS "Allow marketing access to popup campaigns" ON popup_campaigns;

-- Drop broken storage policies
DROP POLICY IF EXISTS "Admin/Marketing can upload hero slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can update their hero slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can delete hero slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can upload fixed banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can update their fixed banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can delete fixed banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can upload popup campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can update their popup campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Marketing can delete popup campaign images" ON storage.objects;

-- ============================================
-- 2. CREATE SECURE RLS POLICIES - FIXED TABLE REFERENCE
-- ============================================

-- Campaign Tables Access Policies (CORRECTED)
-- Admin full access to all campaign features
CREATE POLICY "Admin full access to hero sliders" ON hero_slider_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to fixed banners" ON fixed_banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to popup campaigns" ON popup_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Marketing role access to campaign features
CREATE POLICY "Marketing access to hero sliders" ON hero_slider_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'marketing')
        )
    );

CREATE POLICY "Marketing access to fixed banners" ON fixed_banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'marketing')
        )
    );

CREATE POLICY "Marketing access to popup campaigns" ON popup_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'marketing')
        )
    );

-- Admin Sales role access (READ ONLY for campaign analytics)
CREATE POLICY "Admin Sales read access to hero sliders" ON hero_slider_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin_sales'
        )
    );

CREATE POLICY "Admin Sales read access to fixed banners" ON fixed_banners
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin_sales'
        )
    );

CREATE POLICY "Admin Sales read access to popup campaigns" ON popup_campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin_sales'
        )
    );

-- ============================================
-- 3. CREATE SECURE STORAGE POLICIES - FIXED TABLE REFERENCE
-- ============================================

-- Hero Slider Images Storage Policies
CREATE POLICY "Campaign staff can upload hero slider images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hero-slider-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

CREATE POLICY "Campaign staff can update hero slider images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'hero-slider-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

CREATE POLICY "Campaign staff can delete hero slider images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'hero-slider-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

-- Fixed Banner Images Storage Policies
CREATE POLICY "Campaign staff can upload fixed banner images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fixed-banner-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

CREATE POLICY "Campaign staff can update fixed banner images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'fixed-banner-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

CREATE POLICY "Campaign staff can delete fixed banner images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fixed-banner-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

-- Popup Campaign Images Storage Policies
CREATE POLICY "Campaign staff can upload popup campaign images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'popup-campaign-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

CREATE POLICY "Campaign staff can update popup campaign images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'popup-campaign-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

CREATE POLICY "Campaign staff can delete popup campaign images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'popup-campaign-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing')
    )
  );

-- ============================================
-- 4. SECURITY AUDIT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION audit_campaign_access(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  table_name TEXT,
  access_level TEXT,
  user_role TEXT,
  has_access BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_role TEXT;
BEGIN
  -- Get current user role
  SELECT role INTO current_role 
  FROM public.profiles 
  WHERE profiles.user_id = audit_campaign_access.user_id;

  -- Return access matrix
  RETURN QUERY
  SELECT 
    'hero_slider_items'::TEXT,
    'FULL'::TEXT,
    current_role,
    current_role IN ('admin', 'marketing')
  UNION ALL
  SELECT 
    'fixed_banners'::TEXT,
    'FULL'::TEXT,
    current_role,
    current_role IN ('admin', 'marketing')
  UNION ALL
  SELECT 
    'popup_campaigns'::TEXT,
    'FULL'::TEXT,
    current_role,
    current_role IN ('admin', 'marketing')
  UNION ALL
  SELECT 
    'hero_slider_items'::TEXT,
    'READ_ONLY'::TEXT,
    current_role,
    current_role = 'admin_sales'
  UNION ALL
  SELECT 
    'fixed_banners'::TEXT,
    'READ_ONLY'::TEXT,
    current_role,
    current_role = 'admin_sales'
  UNION ALL
  SELECT 
    'popup_campaigns'::TEXT,
    'READ_ONLY'::TEXT,
    current_role,
    current_role = 'admin_sales';
END;
$$;

-- ============================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY "Admin full access to hero sliders" ON hero_slider_items IS 
'Admin role has full CRUD access to hero slider campaigns';

COMMENT ON POLICY "Marketing access to hero sliders" ON hero_slider_items IS 
'Marketing role has full CRUD access to hero slider campaigns';

COMMENT ON POLICY "Admin Sales read access to hero sliders" ON hero_slider_items IS 
'Admin Sales role has read-only access for analytics and reporting';

COMMENT ON FUNCTION audit_campaign_access IS 
'Security audit function to verify campaign access permissions for roles';