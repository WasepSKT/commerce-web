-- Migration: Coerce products.image_gallery and products.meta to correct types
-- Safely convert when columns exist but stored as text/json strings

-- Stepwise conversion to avoid subquery-in-USING limitation

-- 1) image_gallery → text[]
do $$
declare
  coltype text;
begin
  select data_type into coltype from information_schema.columns 
    where table_schema='public' and table_name='products' and column_name='image_gallery';
  if found and coltype is distinct from 'ARRAY' then
    -- add temp column
    alter table public.products add column if not exists image_gallery_tmp text[] default '{}'::text[];
    -- populate temp with UPDATE (subqueries allowed here)
    update public.products
    set image_gallery_tmp = case
      when image_gallery is null then '{}'::text[]
      when jsonb_typeof(image_gallery::jsonb) = 'array' then (
        select coalesce(array_agg(val), '{}'::text[])
        from jsonb_array_elements_text(image_gallery::jsonb) as val
      )
      else (
        select coalesce(array_agg(trim(both '"' from x)), '{}'::text[])
        from unnest(string_to_array(trim(both '[]' from image_gallery::text), ',')) as x
      )
    end;
    -- swap columns
    alter table public.products drop column image_gallery;
    alter table public.products rename column image_gallery_tmp to image_gallery;
    alter table public.products alter column image_gallery set default '{}'::text[];
  end if;
end$$;

-- 2) meta → jsonb
do $$
declare
  coltype text;
begin
  select data_type into coltype from information_schema.columns 
    where table_schema='public' and table_name='products' and column_name='meta';
  if found and coltype is distinct from 'jsonb' then
    alter table public.products add column if not exists meta_tmp jsonb;
    update public.products
      set meta_tmp = case
        when meta is null then null
        when jsonb_typeof(meta::jsonb) is not null then meta::jsonb
        else to_jsonb(meta)
      end;
    alter table public.products drop column meta;
    alter table public.products rename column meta_tmp to meta;
  end if;
end$$;


