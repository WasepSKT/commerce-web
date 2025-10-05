-- Create campaign tables for Image Slider, Fixed Banner, and Pop-up Campaign management

-- 1. Hero Slider Items table (matches service layer naming)
CREATE TABLE IF NOT EXISTS hero_slider_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Fixed Banners table  
CREATE TABLE IF NOT EXISTS fixed_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('left', 'right')),
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Pop-up Campaigns table
CREATE TABLE IF NOT EXISTS popup_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    button_text TEXT,
    button_url TEXT,
    show_frequency TEXT NOT NULL CHECK (show_frequency IN ('once', 'daily', 'always')),
    delay_seconds INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hero_slider_items_order ON hero_slider_items (order_index, is_active);
CREATE INDEX IF NOT EXISTS idx_fixed_banners_position_active ON fixed_banners (position, is_active);
CREATE INDEX IF NOT EXISTS idx_popup_campaigns_active ON popup_campaigns (is_active, show_frequency);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_hero_slider_items_updated_at ON hero_slider_items;
CREATE TRIGGER update_hero_slider_items_updated_at 
    BEFORE UPDATE ON hero_slider_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fixed_banners_updated_at ON fixed_banners;
CREATE TRIGGER update_fixed_banners_updated_at 
    BEFORE UPDATE ON fixed_banners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_popup_campaigns_updated_at ON popup_campaigns;
CREATE TRIGGER update_popup_campaigns_updated_at 
    BEFORE UPDATE ON popup_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE hero_slider_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
DROP POLICY IF EXISTS "Allow public read access to active hero sliders" ON hero_slider_items;
CREATE POLICY "Allow public read access to active hero sliders" ON hero_slider_items
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access to active fixed banners" ON fixed_banners;
CREATE POLICY "Allow public read access to active fixed banners" ON fixed_banners
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access to active popup campaigns" ON popup_campaigns;
CREATE POLICY "Allow public read access to active popup campaigns" ON popup_campaigns
    FOR SELECT USING (is_active = true);

-- RLS Policies for admin full access
DROP POLICY IF EXISTS "Allow admin full access to hero sliders" ON hero_slider_items;
CREATE POLICY "Allow admin full access to hero sliders" ON hero_slider_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow admin full access to fixed banners" ON fixed_banners;
CREATE POLICY "Allow admin full access to fixed banners" ON fixed_banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow admin full access to popup campaigns" ON popup_campaigns;
CREATE POLICY "Allow admin full access to popup campaigns" ON popup_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policies for marketing role access
DROP POLICY IF EXISTS "Allow marketing access to hero sliders" ON hero_slider_items;
CREATE POLICY "Allow marketing access to hero sliders" ON hero_slider_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'marketing')
        )
    );

DROP POLICY IF EXISTS "Allow marketing access to fixed banners" ON fixed_banners;
CREATE POLICY "Allow marketing access to fixed banners" ON fixed_banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'marketing')
        )
    );

DROP POLICY IF EXISTS "Allow marketing access to popup campaigns" ON popup_campaigns;
CREATE POLICY "Allow marketing access to popup campaigns" ON popup_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'marketing')
        )
    );

-- Insert sample data for development (only if tables are empty)
DO $$
BEGIN
    -- Insert hero slider items if table is empty
    IF NOT EXISTS (SELECT 1 FROM hero_slider_items LIMIT 1) THEN
        INSERT INTO hero_slider_items (title, subtitle, image_url, link_url, button_text, order_index) VALUES
        ('Summer Sale 2024', 'Diskon hingga 50% untuk semua produk kucing', '/placeholder.svg', '/products?category=summer-sale', 'Shop Now', 0),
        ('New Product Launch', 'Makanan premium untuk kucing dewasa', '/placeholder.svg', '/products/premium-adult-food', 'Learn More', 1);
    END IF;

    -- Insert fixed banners if table is empty
    IF NOT EXISTS (SELECT 1 FROM fixed_banners LIMIT 1) THEN
        INSERT INTO fixed_banners (name, position, image_url, link_url) VALUES
        ('Premium Cat Food Banner', 'left', '/placeholder.svg', '/products/premium'),
        ('Special Offer', 'right', '/placeholder.svg', '/products/sale');
    END IF;

    -- Insert popup campaigns if table is empty
    IF NOT EXISTS (SELECT 1 FROM popup_campaigns LIMIT 1) THEN
        INSERT INTO popup_campaigns (title, content, image_url, button_text, button_url, show_frequency) VALUES
        ('Welcome Discount!', 'Dapatkan diskon 20% untuk pembelian pertama Anda!', '/placeholder.svg', 'Claim Discount', '/products?discount=welcome20', 'once'),
        ('Flash Sale Alert!', 'Flash sale 50% OFF hanya hari ini! Jangan sampai terlewat.', '/placeholder.svg', 'Shop Now', '/products/flash-sale', 'daily');
    END IF;
END $$;