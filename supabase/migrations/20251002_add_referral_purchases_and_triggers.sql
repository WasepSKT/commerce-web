-- Migration: add referral_purchases with status and triggers

-- 1) Create referral_purchases table
create table if not exists referral_purchases (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null references profiles(id) on delete cascade,
  order_id text not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'pending', -- pending | completed | refunded | cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id)
);

-- 2) Prevent self-referral
create or replace function fn_referral_prevent_selfref() returns trigger language plpgsql as $$
begin
  if new.referrer_id = new.referred_id then
    raise exception 'self-referral not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_referral_prevent_selfref on referral_purchases;
create trigger trg_referral_prevent_selfref
  before insert on referral_purchases
  for each row execute function fn_referral_prevent_selfref();

-- 3) Add aggregates to profiles if not exists
alter table profiles
  add column if not exists referred_purchases_count integer default 0,
  add column if not exists referred_purchases_total numeric(12,2) default 0,
  add column if not exists referred_invites_count integer default 0,
  add column if not exists referral_score numeric default 0;

-- 4) Function to handle changes: increment/decrement aggregates only when status = 'completed'
create or replace function fn_referral_purchases_status_update() returns trigger language plpgsql as $$
begin
  -- on insert: if new.status = 'completed', add to referrer aggregates
  if (tg_op = 'INSERT') then
    if (new.status = 'completed') then
      update profiles
      set referred_purchases_count = coalesce(referred_purchases_count,0) + 1,
          referred_purchases_total = coalesce(referred_purchases_total,0) + new.amount
      where id = new.referrer_id;
    end if;
    return new;
  end if;

  -- on update: handle status transitions
  if (tg_op = 'UPDATE') then
    -- if changed from non-completed to completed
    if (old.status <> 'completed' and new.status = 'completed') then
      update profiles
      set referred_purchases_count = coalesce(referred_purchases_count,0) + 1,
          referred_purchases_total = coalesce(referred_purchases_total,0) + new.amount
      where id = new.referrer_id;
    end if;

    -- if changed from completed to non-completed (refund/cancel)
    if (old.status = 'completed' and new.status <> 'completed') then
      update profiles
      set referred_purchases_count = greatest(coalesce(referred_purchases_count,0) - 1, 0),
          referred_purchases_total = greatest(coalesce(referred_purchases_total,0) - old.amount, 0)
      where id = old.referrer_id;
    end if;

    -- if amount changed while both completed, adjust total
    if (old.status = 'completed' and new.status = 'completed' and old.amount <> new.amount) then
      update profiles
      set referred_purchases_total = coalesce(referred_purchases_total,0) + (new.amount - old.amount)
      where id = new.referrer_id;
    end if;

    return new;
  end if;

  -- on delete: if deleted and had status completed, decrement
  if (tg_op = 'DELETE') then
    if (old.status = 'completed') then
      update profiles
      set referred_purchases_count = greatest(coalesce(referred_purchases_count,0) - 1, 0),
          referred_purchases_total = greatest(coalesce(referred_purchases_total,0) - old.amount, 0)
      where id = old.referrer_id;
    end if;
    return old;
  end if;

  return null;
end;
$$;

-- 5) Create trigger to call function on insert, update, delete
drop trigger if exists trg_referral_purchases_status_update on referral_purchases;
create trigger trg_referral_purchases_status_update
  after insert or update or delete on referral_purchases
  for each row execute function fn_referral_purchases_status_update();

-- 6) Optional: function to recompute aggregates for backfill
create or replace function fn_referral_recompute_aggregates() returns void language plpgsql as $$
begin
  update profiles p
  set referred_purchases_count = sub.cnt,
      referred_purchases_total = sub.sum
  from (
    select referrer_id, count(*) as cnt, coalesce(sum(amount),0) as sum
    from referral_purchases
    where status = 'completed'
    group by referrer_id
  ) sub
  where p.id = sub.referrer_id;
end;
$$;

-- 7) Optional: prevent duplicate order insert by unique(order_id) already added

-- End migration
