#!/usr/bin/env node
/*
 * scripts/cleanup-orphan-images.cjs
 * - Dry-run by default: writes `orphan-list.json` with unreferenced files.
 * - `--apply` will delete those files from the `product-images` bucket (USE WITH CAUTION).
 * - Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */

// load dotenv if available (optional)
try {
  require("dotenv").config();
} catch (e) {}

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Aborting."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const APPLY = process.argv.includes("--apply");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT =
  LIMIT_IDX >= 0 && process.argv[LIMIT_IDX + 1]
    ? parseInt(process.argv[LIMIT_IDX + 1], 10)
    : undefined;

async function listAllFiles(prefix = "") {
  const bucket = "product-images";
  let files = [];
  let opts = { limit: 1000, offset: 0, search: prefix };

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list("", opts);
    if (error) throw error;
    files = files.concat(data.map((f) => f.name));
    if (data.length < opts.limit) break;
    opts.offset += opts.limit;
  }
  return files;
}

async function fetchReferencedPaths() {
  // Fetch image_path and image_gallery_paths from products
  let query = supabase
    .from("products")
    .select("id, image_path, image_gallery_paths");
  if (LIMIT) query = query.limit(LIMIT);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const paths = new Set();
  for (const r of rows) {
    if (r.image_path) paths.add(r.image_path);
    if (r.image_gallery_paths && Array.isArray(r.image_gallery_paths)) {
      for (const p of r.image_gallery_paths) if (p) paths.add(p);
    }
  }
  return paths;
}

async function main() {
  console.log(
    `Orphan cleanup started. APPLY=${APPLY ? "yes" : "no"}, LIMIT=${
      LIMIT || "none"
    }`
  );
  const allFiles = await listAllFiles();
  console.log(
    `Found ${allFiles.length} files in storage bucket 'product-images'`
  );

  const referenced = await fetchReferencedPaths();
  console.log(`Found ${referenced.size} referenced paths in DB`);

  const orphans = allFiles.filter((f) => !referenced.has(f));
  console.log(`Identified ${orphans.length} orphan files`);

  const outPath = path.resolve(process.cwd(), "orphan-list.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        count: orphans.length,
        orphans,
      },
      null,
      2
    )
  );
  console.log(`Wrote orphan list to ${outPath}`);

  if (!APPLY) {
    console.log(
      "Dry-run complete. To delete the listed files re-run with --apply"
    );
    return;
  }

  console.log("Applying deletions...");
  const bucket = "product-images";
  for (const file of orphans) {
    const { data, error } = await supabase.storage.from(bucket).remove([file]);
    if (error) {
      console.error(`Failed to delete ${file}:`, error.message || error);
    } else {
      console.log(`Deleted ${file}`);
    }
  }
  console.log("Deletion pass complete.");
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
