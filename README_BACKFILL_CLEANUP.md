# Backfill & Orphan Cleanup

This document explains how to run the image-path backfill and orphan cleanup scripts included in the repository.

Security: both scripts require a Supabase service role key. Run them from a secure environment — do not share the key.

Files added:

- `scripts/backfill-image-paths.cjs` — backfill `image_path` and `image_gallery_paths` from existing `image_url` / `image_gallery`.
- `scripts/cleanup-orphan-images.cjs` — list and optionally delete orphan files in `product-images` bucket.

Usage examples (PowerShell):

1. Dry-run backfill (preview):

```powershell
$env:SUPABASE_URL = '<your-supabase-url>'
$env:SUPABASE_SERVICE_ROLE_KEY = '<your-service-role-key>'
node .\scripts\backfill-image-paths.cjs --limit 50
```

2. Apply backfill (batch):

```powershell
$env:SUPABASE_URL = '<your-supabase-url>'
$env:SUPABASE_SERVICE_ROLE_KEY = '<your-service-role-key>'
node .\scripts\backfill-image-paths.cjs --apply --limit 500
```

3. Dry-run orphan cleanup (writes `orphan-list.json`):

```powershell
$env:SUPABASE_URL = '<your-supabase-url>'
$env:SUPABASE_SERVICE_ROLE_KEY = '<your-service-role-key>'
node .\scripts\cleanup-orphan-images.cjs
```

4. Apply orphan deletions (AFTER manual review):

```powershell
$env:SUPABASE_URL = '<your-supabase-url>'
$env:SUPABASE_SERVICE_ROLE_KEY = '<your-service-role-key>'
node .\scripts\cleanup-orphan-images.cjs --apply
```

Notes

- Always run dry-run first and review the `orphan-list.json` file.
- Create DB / storage backups or snapshots if available before large deletions.
- For production safety, prefer enqueuing deletion jobs instead of deleting inline during product updates.
