-- Migration: add referral_levels and scoring functions

-- 1) Create referral_levels table
create table if not exists referral_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_amount numeric(12,2) not null default 0,
  max_amount numeric(12,2),
  weight integer not null default 1,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Add referred_level_id to profiles (to store current level of a referred user)
alter table profiles
  add column if not exists referred_level_id uuid null;

-- 3) Helper function: get matching level id for an amount
create or replace function fn_get_level_id_for_amount(a numeric) returns uuid language sql as $$
  select id from referral_levels rl
  where rl.active = true
    and rl.min_amount <= coalesce(a,0)
    and (rl.max_amount is null or coalesce(a,0) < rl.max_amount)
  order by rl.priority desc limit 1;
$$;

-- 4) Function to recompute referral_score for a referrer
create or replace function fn_recompute_referrer_score(referrer_uuid uuid) returns void language plpgsql as $$
begin
  -- compute total score as sum of weights of each referred user's current level
  with referred_totals as (
    select p.id as referred_id, coalesce(sum(rp.amount),0) as total
    from profiles p
    left join referral_purchases rp on rp.referred_id = p.id and rp.status = 'completed'
    where p.referred_by = referrer_uuid
    group by p.id
  ), referred_weights as (
    select rt.referred_id, rl.id as level_id, rl.weight
    from referred_totals rt
    left join referral_levels rl on rl.active = true and rl.min_amount <= rt.total and (rl.max_amount is null or rt.total < rl.max_amount)
  ), total_score as (
    select coalesce(sum(coalesce(weight,0)),0) as score from referred_weights
  )
  update profiles p
  set referral_score = (select score from total_score)
  where p.id = referrer_uuid;
end;
$$;

-- 5) Optionally update referred_level_id for each referred user of a referrer
create or replace function fn_update_referred_levels_for_referrer(referrer_uuid uuid) returns void language plpgsql as $$
begin
  update profiles p
  set referred_level_id = fn_get_level_id_for_amount(sub.total)
  from (
    select p2.id, coalesce(sum(rp.amount),0) as total
    from profiles p2
    left join referral_purchases rp on rp.referred_id = p2.id and rp.status = 'completed'
    where p2.referred_by = referrer_uuid
    group by p2.id
  ) sub
  where p.id = sub.id and p.referred_by = referrer_uuid;
end;
$$;

-- 6) Wrapper to recompute score + update levels for a referrer
create or replace function fn_recompute_score_and_levels_for_referrer(referrer_uuid uuid) returns void language plpgsql as $$
begin
  perform fn_update_referred_levels_for_referrer(referrer_uuid);
  perform fn_recompute_referrer_score(referrer_uuid);
end;
$$;

-- 7) Trigger function to call recompute when referral_purchases change (affects referrer)
create or replace function fn_referral_purchases_recompute_trigger() returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    -- call recompute for new.referrer_id
    if (new.referrer_id is not null) then
      perform fn_recompute_score_and_levels_for_referrer(new.referrer_id);
    end if;
    return new;
  end if;

  if (tg_op = 'UPDATE') then
    -- if referrer changed, recompute both
    if (old.referrer_id is not null) then
      perform fn_recompute_score_and_levels_for_referrer(old.referrer_id);
    end if;
    if (new.referrer_id is not null and new.referrer_id <> old.referrer_id) then
      perform fn_recompute_score_and_levels_for_referrer(new.referrer_id);
    else
      -- same referrer, recompute for them
      if (new.referrer_id is not null) then
        perform fn_recompute_score_and_levels_for_referrer(new.referrer_id);
      end if;
    end if;
    return new;
  end if;

  if (tg_op = 'DELETE') then
    if (old.referrer_id is not null) then
      perform fn_recompute_score_and_levels_for_referrer(old.referrer_id);
    end if;
    return old;
  end if;

  return null;
end;
$$;

-- 8) Create trigger
drop trigger if exists trg_referral_purchases_recompute on referral_purchases;
create trigger trg_referral_purchases_recompute
  after insert or update or delete on referral_purchases
  for each row execute function fn_referral_purchases_recompute_trigger();

-- 9) Optional: initial sample levels (admin can change in dashboard later)
insert into referral_levels (name, min_amount, max_amount, weight, priority)
values
  ('Pemula', 1000000, 5000000, 1, 10),
  ('Mahir', 5000000, 10000000, 3, 20),
  ('Pro', 10000000, null, 10, 30)
on conflict do nothing;

-- End migration
