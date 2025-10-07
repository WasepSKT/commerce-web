-- Migration: add RPC to atomically mark referral orders completed (admin only)

-- This function is SECURITY DEFINER and should be created by a privileged role (service role / db owner).
-- It verifies caller is an admin by checking profiles.user_id = auth.uid(). Adjust if your admin detection differs.

create or replace function rpc_mark_referral_orders_completed(order_ids text[]) returns int language plpgsql security definer as $$
declare
  affected_referrers uuid[] := array[]::uuid[];
  ref_id uuid;
  updated_count int := 0;
begin
  -- only allow authenticated admins to call this RPC
  if not exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin') then
    raise exception 'only admin may call rpc_mark_referral_orders_completed';
  end if;

  -- Atomically update and collect distinct referrer_ids
  with updated as (
    update referral_purchases
    set status = 'completed', updated_at = now()
    where order_id = any(order_ids) and status <> 'completed'
    returning referrer_id
  )
  -- ARRAY(SELECT DISTINCT ...) avoids aggregate-context issues in some environments
  select array(SELECT DISTINCT referrer_id FROM updated) into affected_referrers;

  if affected_referrers is not null then
    -- recompute for each affected referrer
    foreach ref_id in array affected_referrers loop
      if ref_id is not null then
        perform fn_recompute_score_and_levels_for_referrer(ref_id);
      end if;
    end loop;
    updated_count := cardinality(affected_referrers);
  else
    updated_count := 0;
  end if;

  return updated_count;
end;
$$;

-- Optional: grant execute to authenticated role if desired (uncomment to grant to authenticated users who pass admin check)
-- grant execute on function rpc_mark_referral_orders_completed(text[]) to authenticated;

-- End migration
