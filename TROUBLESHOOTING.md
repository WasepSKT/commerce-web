# Troubleshooting Guide

## Error: RPC Function Not Found (404)

### Gejala

```
POST https://...supabase.co/rest/v1/rpc/rpc_delete_product_enqueue 404 (Not Found)
rpc_delete_product_enqueue not available or failed
```

### Penyebab

Error ini terjadi karena:

1. **Cache browser/build lama** - Masih ada referensi ke RPC yang sudah dihapus
2. **Migration belum dijalankan** - RPC functions masih ada di database

### Solusi

#### 1. Clear Browser Cache

- **Chrome/Edge**: `Ctrl + Shift + Delete` → Clear cached images and files
- **Firefox**: `Ctrl + Shift + Delete` → Clear cache
- Atau gunakan **Incognito/Private mode**

#### 2. Rebuild Application

```bash
# Hapus build cache
rm -rf dist node_modules/.vite

# Rebuild
npm run build
```

#### 3. Jalankan Migration

Pastikan migration untuk menghapus RPC sudah dijalankan:

```sql
-- File: supabase/migrations/20251121_remove_storage_delete_queue.sql
DROP FUNCTION IF EXISTS public.rpc_update_product_gallery(uuid, text, text[], text, text[], text[]);
DROP FUNCTION IF EXISTS public.rpc_delete_product_enqueue(uuid, text[]);
DROP TABLE IF EXISTS public.storage_delete_queue;
```

#### 4. Hard Refresh Browser

- **Windows/Linux**: `Ctrl + F5` atau `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

## Error: Foreign Key Constraint (409 Conflict)

### Gejala

```
DELETE .../products?id=eq.xxx 409 (Conflict)
update or delete on table "products" violates foreign key constraint
"order_items_product_id_fkey" on table "order_items"
```

### Penyebab

Product tidak bisa dihapus karena masih direferensikan di `order_items` (ada di order history).

### Solusi

#### Opsi 1: Jalankan Migration (Recommended)

Jalankan migration untuk mengubah constraint menjadi `ON DELETE SET NULL`:

```sql
-- File: supabase/migrations/20251121_fix_product_delete_constraint.sql
-- Migration ini akan mengubah constraint sehingga product bisa dihapus
-- dan order_items.product_id akan menjadi NULL (order history tetap ada)
```

Setelah migration, product bisa langsung dihapus tanpa error.

#### Opsi 2: Soft Delete (Current Implementation)

Sistem saat ini sudah handle error ini dengan **soft delete**:

- Jika delete gagal karena foreign key constraint
- Sistem akan otomatis set `is_active = false`
- Product dinonaktifkan, tidak dihapus permanen
- Order history tetap utuh

### Catatan

- **Hard Delete**: Product benar-benar dihapus dari database
- **Soft Delete**: Product dinonaktifkan (`is_active = false`), masih ada di database
- Setelah migration constraint, hard delete akan bekerja dengan baik

## Verifikasi

### Cek RPC Functions

```sql
-- Cek apakah RPC masih ada
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('rpc_update_product_gallery', 'rpc_delete_product_enqueue');
-- Seharusnya tidak ada hasil
```

### Cek Storage Delete Queue

```sql
-- Cek apakah table masih ada
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'storage_delete_queue';
-- Seharusnya tidak ada hasil
```

### Cek Foreign Key Constraint

```sql
-- Cek constraint order_items
SELECT conname, confdeltype
FROM pg_constraint
WHERE conrelid = 'public.order_items'::regclass
  AND confrelid = 'public.products'::regclass
  AND contype = 'f';
-- confdeltype: 'n' = no action, 's' = set null, 'c' = cascade
-- Setelah migration, seharusnya 's' (set null)
```
