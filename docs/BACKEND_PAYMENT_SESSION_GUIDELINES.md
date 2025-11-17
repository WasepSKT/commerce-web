# Backend Guidelines — Payment Session ↔ Order Mapping

Dokumen ini berisi instruksi praktis untuk memastikan backend consistent dengan perubahan frontend yang mengandalkan `orders.session_id` dan fallback lookup `payments.session_id`.

Isi:

- Ringkasan tujuan
- Migrasi DB & index
- Saat membuat payment session (atomic update)
- Webhook handler (idempotent upsert + link)
- Backfill (one-off)
- Admin queries & monitoring
- Security, RLS & testing checklist

---

## Ringkasan tujuan

Frontend sekarang akan:

- Menyimpan `orders.session_id` jika tersedia dan
- Saat menampilkan OrderDetail: mencoba lookup `payments` by `order_id` lalu fallback `payments` by `session_id`.

Backend harus memastikan data tersinkronisasi agar lookup deterministic, mengurangi race condition, dan memudahkan rekonsiliasi.

Tujuan teknis:

- Simpan `session_id` ke `orders` segera setelah payment session dibuat (transactional bila mungkin).
- Webhook harus `UPSERT` `payments` berdasarkan `session_id` (idempotent) dan link ke `orders` bila memungkinkan.
- Beri mekanisme backfill untuk data historis.

---

## 1) DB: kolom & index (migration)

Pastikan perubahan ini ada di DB (Anda telah menambahkan `orders.session_id`). Tambahkan index pada `payments.session_id`:

```sql
-- ensure orders.session_id exists (safe)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS session_id text;

CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders (session_id);

-- index on payments.session_id for fast lookup and idempotency
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON public.payments (session_id);
-- (gunakan UNIQUE index HANYA kalau provider menjamin session_id unik)
```

---

## 2) Saat membuat payment session (backend)

Set `orders.session_id` segera setelah backend menerima session dari provider. Lakukan dalam transaction bila memungkinkan.

Contoh (Node + `pg`):

```js
// setelah menerima response dari provider
const sessionId = providerResponse.session_id;

await db.query("BEGIN");
try {
  await db.query(
    `UPDATE orders SET session_id = $1 WHERE id = $2 AND (session_id IS NULL OR session_id = '')`,
    [sessionId, orderId]
  );

  // optional: buat initial payments row
  await db.query(
    `INSERT INTO payments (session_id, order_id, created_at) VALUES ($1, $2, now()) ON CONFLICT (session_id) DO NOTHING`,
    [sessionId, orderId]
  );

  await db.query("COMMIT");
} catch (err) {
  await db.query("ROLLBACK");
  throw err;
}

// return sessionId & redirect/url ke frontend
```

Catatan: jangan izinkan client menulis `orders.session_id` langsung — hanya backend/service role.

---

## 3) Webhook handler (idempotent upsert + linking)

Principles:

- Verifikasi signature.
- Upsert `payments` by `session_id` (ON CONFLICT (session_id)).
- Jika webhook menyediakan `order_id` (metadata), set `orders.session_id` (jika kosong).
- Jika webhook tidak berisi `order_id`, coba link `payments` -> `orders` via `session_id`.

Pseudocode (Node + `pg`):

```js
app.post("/webhook/payment", async (req, res) => {
  if (!verifySignature(req)) return res.status(400).end();

  const payload = req.body;
  const sessionId = payload.session_id;
  const maybeOrderId = payload.metadata?.order_id || null;
  const method = payload.method || null;
  const channel = payload.channel || null;

  await db.query("BEGIN");
  try {
    // upsert payment by session_id
    await db.query(
      `INSERT INTO payments (session_id, order_id, payment_method, payment_channel, created_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (session_id) DO UPDATE
         SET order_id = COALESCE(payments.order_id, EXCLUDED.order_id),
             payment_method = EXCLUDED.payment_method,
             payment_channel = EXCLUDED.payment_channel`,
      [sessionId, maybeOrderId, method, channel]
    );

    if (maybeOrderId) {
      await db.query(
        `UPDATE orders SET session_id = $1 WHERE id = $2 AND (session_id IS NULL OR session_id = '')`,
        [sessionId, maybeOrderId]
      );
    } else {
      // fallback: link payments to orders using session_id
      await db.query(
        `UPDATE payments p SET order_id = o.id FROM orders o WHERE p.session_id = o.session_id AND p.session_id = $1 AND p.order_id IS NULL`,
        [sessionId]
      );
    }

    // optional: update order status based on payment status

    await db.query("COMMIT");
    res.status(200).send("ok");
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    res.status(500).send("error");
  }
});
```

---

## 4) Backfill (one-off, staging first)

Jalankan di staging dan verifikasi sebelum produksi.

1. Isi `orders.session_id` dari `payments` yang sudah ada:

```sql
UPDATE orders
SET session_id = p.session_id
FROM payments p
WHERE p.order_id = orders.id
  AND p.session_id IS NOT NULL
  AND (orders.session_id IS NULL OR orders.session_id = '');
```

2. Link `payments` tanpa `order_id` ke `orders` yang punya `session_id`:

```sql
UPDATE payments p
SET order_id = o.id
FROM orders o
WHERE p.session_id = o.session_id
  AND p.order_id IS NULL
  AND p.session_id IS NOT NULL;
```

Catatan: lakukan audit dan backup sebelum run di production.

---

## 5) Admin queries & monitoring

- Hitung orphan payments:

```sql
SELECT count(*) FROM payments WHERE order_id IS NULL;
```

- List recent orphan payments:

```sql
SELECT id, session_id, created_at FROM payments WHERE order_id IS NULL ORDER BY created_at DESC LIMIT 50;
```

- Find orders missing session_id but have payments:

```sql
SELECT o.id AS order_id, p.session_id, p.id AS payment_id
FROM orders o
JOIN payments p ON p.order_id = o.id
WHERE (o.session_id IS NULL OR o.session_id = '');
```

Rekomendasi alert: jika count(orphan payments) naik tajam, lakukan investigasi segera.

---

## 6) Security & operational notes

- Verifikasi webhook signature sebelum memproses payload.
- Gunakan credential/service-role yang memiliki izin menulis `orders` dan `payments`.
- Jangan biarkan browser menulis `orders.session_id`.
- Gunakan transactions dan `ON CONFLICT (session_id)` untuk idempotency.
- Jika concurrency tinggi, pertimbangkan advisory locks per `session_id`.

---

## 7) Testing checklist

1. Staging flow: create order -> create session -> verify `orders.session_id` set.
2. Webhook before session written: simulate webhook arriving before orders update — final state should link payment->order.
3. Webhook replay: simulate same webhook multiple times — ensure idempotency.
4. Backfill dry-run: run SELECT variant first to verify rows affected, then run UPDATE.

---

## 8) Deployment checklist

- Add indexes and run backfill on staging.
- Deploy backend changes for session-creation and webhook.
- Run tests on staging, verify OrderDetail shows payment method/channel.
- Enable monitoring/alert for orphan payments.

---

Jika Anda mau, saya bisa juga:

- Buat file migration SQL untuk backfill + index (siap-apply), atau
- Tuliskan PR-ready backend code (Node/Express) untuk `create-session` dan `webhook` handler.

Pilih dan saya akan buatkan file atau patch berikutnya.
