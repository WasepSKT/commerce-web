-- Migration: Add SEO fields to blogs and products tables
-- This migration adds automatic SEO generation fields

-- Add SEO fields to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS seo_structured_data JSONB;

-- Add SEO fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS seo_structured_data JSONB;

-- Create function to automatically generate SEO data for blogs
CREATE OR REPLACE FUNCTION generate_blog_seo()
RETURNS TRIGGER AS $$
DECLARE
    clean_content TEXT;
    excerpt TEXT;
    title TEXT;
    description TEXT;
    keywords TEXT;
    title_words TEXT[];
    content_words TEXT[];
BEGIN
    -- Clean content for description
    clean_content := regexp_replace(NEW.content, '<[^>]*>', '', 'g');
    excerpt := CASE 
        WHEN length(clean_content) > 160 THEN 
            substring(clean_content, 1, 160) || '...'
        ELSE clean_content
    END;

    -- Generate title with brand
    title := NEW.title || ' | Blog Regal Paw - Tips & Perawatan Kucing';

    -- Generate description with call-to-action
    description := COALESCE(NEW.meta_description, 
        excerpt || ' Baca artikel lengkap tentang ' || NEW.title || ' di Regal Paw. Tips terbaik untuk perawatan kucing kesayangan Anda.');

    -- Generate keywords from title and content
    title_words := string_to_array(lower(NEW.title), ' ');
    content_words := string_to_array(lower(clean_content), ' ');
    
    keywords := array_to_string(
        ARRAY[
            'blog kucing',
            'tips kucing', 
            'perawatan kucing',
            'Regal Paw',
            'makanan kucing premium'
        ] || title_words || content_words[1:10], 
        ', '
    );

    -- Update SEO fields
    NEW.meta_title := title;
    NEW.meta_description := description;
    NEW.meta_keywords := keywords;
    NEW.og_title := title;
    NEW.og_description := description;
    NEW.og_image := COALESCE(NEW.cover_url, 'https://regalpaw.id/og-image.jpg');
    NEW.canonical_url := '/blog/' || NEW.slug;

    -- Generate structured data
    NEW.seo_structured_data := jsonb_build_object(
        '@context', 'https://schema.org',
        '@type', 'BlogPosting',
        'headline', NEW.title,
        'description', description,
        'image', NEW.og_image,
        'author', jsonb_build_object(
            '@type', 'Person',
            'name', 'Regal Paw Team'
        ),
        'publisher', jsonb_build_object(
            '@type', 'Organization',
            'name', 'Regal Paw',
            'logo', jsonb_build_object(
                '@type', 'ImageObject',
                'url', 'https://regalpaw.id/logo.png'
            )
        ),
        'datePublished', NEW.created_at,
        'dateModified', COALESCE(NEW.updated_at, NEW.created_at),
        'mainEntityOfPage', jsonb_build_object(
            '@type', 'WebPage',
            '@id', 'https://regalpaw.id/blog/' || NEW.slug
        ),
        'keywords', keywords
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically generate SEO data for products
CREATE OR REPLACE FUNCTION generate_product_seo()
RETURNS TRIGGER AS $$
DECLARE
    title TEXT;
    description TEXT;
    keywords TEXT;
    price_formatted TEXT;
BEGIN
    -- Format price
    price_formatted := to_char(NEW.price, 'FM999,999,999') || ' IDR';

    -- Generate title with price and category
    title := NEW.name || ' - ' || NEW.category || ' Premium | Regal Paw';

    -- Generate description with benefits and price
    description := COALESCE(NEW.meta_description,
        substring(NEW.description, 1, 120) || '... Beli ' || NEW.name || 
        ' dengan harga ' || price_formatted || 
        '. Kualitas premium untuk kesehatan kucing kesayangan Anda. Stok tersedia ' || 
        NEW.stock_quantity || ' unit.');

    -- Generate keywords
    keywords := array_to_string(ARRAY[
        lower(NEW.name),
        'makanan kucing ' || lower(NEW.category),
        lower(NEW.category),
        'Regal Paw',
        'makanan kucing premium',
        'nutrisi kucing',
        'kesehatan kucing',
        'makanan kucing berkualitas'
    ], ', ');

    -- Update SEO fields
    NEW.meta_title := title;
    NEW.meta_description := description;
    NEW.meta_keywords := keywords;
    NEW.og_title := title;
    NEW.og_description := description;
    NEW.og_image := COALESCE(NEW.image_url, 'https://regalpaw.id/og-image.jpg');
    NEW.canonical_url := '/product/' || lower(regexp_replace(NEW.name, '\s+', '-', 'g'));

    -- Generate structured data
    NEW.seo_structured_data := jsonb_build_object(
        '@context', 'https://schema.org',
        '@type', 'Product',
        'name', NEW.name,
        'description', NEW.description,
        'image', NEW.og_image,
        'brand', jsonb_build_object(
            '@type', 'Brand',
            'name', 'Regal Paw'
        ),
        'category', NEW.category,
        'offers', jsonb_build_object(
            '@type', 'Offer',
            'price', NEW.price,
            'priceCurrency', 'IDR',
            'availability', CASE 
                WHEN NEW.stock_quantity > 0 THEN 'https://schema.org/InStock'
                ELSE 'https://schema.org/OutOfStock'
            END,
            'seller', jsonb_build_object(
                '@type', 'Organization',
                'name', 'Regal Paw'
            ),
            'url', 'https://regalpaw.id/product/' || lower(regexp_replace(NEW.name, '\s+', '-', 'g'))
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically generate SEO data
DROP TRIGGER IF EXISTS trigger_generate_blog_seo ON public.blogs;
CREATE TRIGGER trigger_generate_blog_seo
    BEFORE INSERT OR UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION generate_blog_seo();

DROP TRIGGER IF EXISTS trigger_generate_product_seo ON public.products;
CREATE TRIGGER trigger_generate_product_seo
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION generate_product_seo();

-- Create indexes for better SEO performance
CREATE INDEX IF NOT EXISTS idx_blogs_meta_title ON public.blogs (meta_title);
CREATE INDEX IF NOT EXISTS idx_blogs_meta_keywords ON public.blogs (meta_keywords);
CREATE INDEX IF NOT EXISTS idx_products_meta_title ON public.products (meta_title);
CREATE INDEX IF NOT EXISTS idx_products_meta_keywords ON public.products (meta_keywords);

-- Update existing records to generate SEO data
UPDATE public.blogs SET 
    meta_title = meta_title,
    meta_description = meta_description,
    meta_keywords = meta_keywords,
    og_title = og_title,
    og_description = og_description,
    og_image = og_image,
    canonical_url = canonical_url,
    seo_structured_data = seo_structured_data
WHERE meta_title IS NULL;

UPDATE public.products SET 
    meta_title = meta_title,
    meta_description = meta_description,
    meta_keywords = meta_keywords,
    og_title = og_title,
    og_description = og_description,
    og_image = og_image,
    canonical_url = canonical_url,
    seo_structured_data = seo_structured_data
WHERE meta_title IS NULL;
