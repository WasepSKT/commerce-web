#!/usr/bin/env node
try {
  require("dotenv").config();
} catch (e) {
  /* dotenv not installed; continue */
}
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function runOnce() {
  console.log(new Date().toISOString(), "Worker: checking queue...");

  const { data: rows, error: selErr } = await supabase
    .from("storage_delete_queue")
    .select("*")
    .eq("status", "pending")
    .limit(20);

  if (selErr) {
    console.error("Failed to fetch queue rows:", selErr.message || selErr);
    process.exitCode = 2;
    return;
  }

  if (!rows || rows.length === 0) {
    console.log("No pending items found. Exiting.");
    return;
  }

  console.log(`Found ${rows.length} pending item(s)`);

  for (const row of rows) {
    const id = row.id;
    const bucket = row.bucket || "product-images";
    const path = row.path;

    if (!path) {
      console.warn(`Queue id=${id} has empty path — marking failed`);
      await supabase
        .from("storage_delete_queue")
        .update({
          status: "failed",
          last_error: "empty path",
          attempts: (row.attempts || 0) + 1,
        })
        .eq("id", id);
      continue;
    }

    console.log(`Deleting [${bucket}] ${path} (queue id=${id})`);

    try {
      // remove expects an array of object paths
      const { data: remData, error: remErr } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (remErr) {
        // treat 'object not found' style errors as success (idempotent)
        console.warn(`Remove error for id=${id}:`, remErr.message || remErr);
        await supabase
          .from("storage_delete_queue")
          .update({
            status: "failed",
            last_error: remErr.message || String(remErr),
            attempts: (row.attempts || 0) + 1,
          })
          .eq("id", id);
        continue;
      }

      console.log(`Deleted ${path} — updating queue id=${id} to done`);
      await supabase
        .from("storage_delete_queue")
        .update({ status: "done", processed_at: new Date().toISOString() })
        .eq("id", id);
    } catch (err) {
      console.error(
        `Unexpected error processing id=${id}:`,
        err && err.message ? err.message : String(err)
      );
      await supabase
        .from("storage_delete_queue")
        .update({
          status: "failed",
          last_error: err && err.message ? err.message : String(err),
          attempts: (row.attempts || 0) + 1,
        })
        .eq("id", id);
    }
  }

  console.log("Worker run complete");
}

if (require.main === module) {
  runOnce()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Worker failed:", e);
      process.exit(1);
    });
}
