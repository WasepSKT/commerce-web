-- Migration: add expiry function to cancel pending referral purchases older than 1 day

-- 1) Function to expire pending referral purchases
create or replace function fn_expire_pending_referral_purchases() returns void language plpgsql as $$
begin
  update referral_purchases
  set status = 'cancelled', updated_at = now()
  where status = 'pending' and created_at < now() - interval '1 day';
end;
$$;

-- 2) Helpful index to accelerate expiry and reporting queries
create index if not exists idx_referral_purchases_status_created_at on referral_purchases(status, created_at);

-- 3) Scheduling notes:
-- If you have pg_cron installed and the rights, you can schedule this to run hourly:
-- select cron.schedule('expire_referrals_hourly', '0 * * * *', $$select fn_expire_pending_referral_purchases()$$);

-- On Supabase you can also use "Scheduled Functions" (Edge functions) or invoke this function from a scheduled HTTP endpoint.

-- End migration
