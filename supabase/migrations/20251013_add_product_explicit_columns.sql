-- 2025-10-13: Add explicit product columns for specs and backfill from meta
BEGIN;

-- 1) Add explicit columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='brand'
  ) THEN
    ALTER TABLE public.products ADD COLUMN brand text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='product_type'
  ) THEN
    ALTER TABLE public.products ADD COLUMN product_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='pet_type'
  ) THEN
    ALTER TABLE public.products ADD COLUMN pet_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='origin_country'
  ) THEN
    ALTER TABLE public.products ADD COLUMN origin_country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='expiry_date'
  ) THEN
    ALTER TABLE public.products ADD COLUMN expiry_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='age_category'
  ) THEN
    ALTER TABLE public.products ADD COLUMN age_category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='weight_grams'
  ) THEN
    ALTER TABLE public.products ADD COLUMN weight_grams integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='length_cm'
  ) THEN
    ALTER TABLE public.products ADD COLUMN length_cm integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='width_cm'
  ) THEN
    ALTER TABLE public.products ADD COLUMN width_cm integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='height_cm'
  ) THEN
    ALTER TABLE public.products ADD COLUMN height_cm integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='discount_percent'
  ) THEN
    ALTER TABLE public.products ADD COLUMN discount_percent numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='sku'
  ) THEN
    ALTER TABLE public.products ADD COLUMN sku text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='shipping_options'
  ) THEN
    ALTER TABLE public.products ADD COLUMN shipping_options jsonb DEFAULT '[]'::jsonb;
  END IF;
END$$;

-- 2) Backfill from meta where fields exist
-- Note: meta is expected to be jsonb with keys like 'brand','productType','petType','originCountry','expiryDate','ageCategory','weight','lengthVal','widthVal','heightVal','discountPercent','sku','shippingOptions'
DO $$
BEGIN
  -- Only attempt backfill if the 'meta' column actually exists on products
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='meta'
  ) THEN
    UPDATE public.products
    SET
      brand = COALESCE(brand, (meta->>'brand')),
      product_type = COALESCE(product_type, (meta->>'productType')),
      pet_type = COALESCE(pet_type, (meta->>'petType')),
      origin_country = COALESCE(origin_country, (meta->>'originCountry')),
      expiry_date = COALESCE(expiry_date, NULLIF(meta->>'expiryDate','')::date),
      age_category = COALESCE(age_category, (meta->>'ageCategory')),
      weight_grams = COALESCE(weight_grams, NULLIF(meta->>'weight','')::integer),
      length_cm = COALESCE(length_cm, NULLIF(meta->>'lengthVal','')::integer),
      width_cm = COALESCE(width_cm, NULLIF(meta->>'widthVal','')::integer),
      height_cm = COALESCE(height_cm, NULLIF(meta->>'heightVal','')::integer),
      discount_percent = COALESCE(discount_percent, NULLIF(meta->>'discountPercent','')::numeric),
      sku = COALESCE(sku, (meta->>'sku')),
      shipping_options = COALESCE(shipping_options, (meta->'shippingOptions'))
    WHERE meta IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipping backfill: column "meta" does not exist on public.products';
  END IF;
END$$;

-- 3) Add indexes for common queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_sku') THEN
    CREATE INDEX idx_products_sku ON public.products (sku);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_brand') THEN
    CREATE INDEX idx_products_brand ON public.products (brand);
  END IF;
END$$;

COMMIT;
