-- Add meta_description field to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS meta_description text;

-- Add comment for documentation
COMMENT ON COLUMN public.blogs.meta_description IS 'SEO meta description for the blog post, recommended 150-160 characters';