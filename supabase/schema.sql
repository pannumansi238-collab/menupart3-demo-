create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  price integer not null check (price > 0),
  category text not null check (category in ('Starters', 'Mains', 'Biryani & Rice', 'Breads', 'Desserts', 'Drinks')),
  cuisine text not null,
  diet text not null check (diet in ('veg', 'non-veg')),
  spice integer not null check (spice between 0 and 3),
  bestseller boolean not null default false,
  chef_special boolean not null default false,
  available boolean not null default true,
  image text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists menu_items_category_idx on public.menu_items(category);
create index if not exists menu_items_cuisine_idx on public.menu_items(cuisine);
create index if not exists menu_items_available_idx on public.menu_items(available);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_number integer check (table_number between 1 and 999),
  instructions text not null default '',
  subtotal integer not null,
  gst integer not null,
  total integer not null,
  status text not null default 'New' check (status in ('New', 'Preparing', 'Ready', 'Served', 'Paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id text references public.menu_items(id) on delete set null,
  name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity between 1 and 30),
  note text not null default ''
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create table if not exists public.reward_pool (
  id text primary key,
  label text not null,
  reward_type text not null check (reward_type in ('discount', 'free_item', 'none')),
  value integer not null default 0,
  weight integer not null default 1 check (weight >= 0),
  redemption text not null check (redemption in ('this_bill', 'next_visit')),
  active boolean not null default true
);
insert into public.reward_pool(id, label, reward_type, value, weight, redemption) values
  ('discount-10', '10% off', 'discount', 10, 12, 'next_visit'),
  ('discount-20', '20% off', 'discount', 20, 3, 'next_visit'),
  ('free-coffee', 'A coffee on us', 'free_item', 1, 10, 'next_visit'),
  ('free-juice', 'A fresh juice on us', 'free_item', 1, 7, 'next_visit'),
  ('free-dessert', 'A dessert on us', 'free_item', 1, 8, 'this_bill'),
  ('try-again', 'Better luck next time', 'none', 0, 60, 'this_bill')
on conflict (id) do nothing;

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  pool_id text not null references public.reward_pool(id),
  label text not null,
  code text unique,
  redemption text not null,
  expires_at timestamptz not null default (now() + interval '60 days'),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists rewards_code_idx on public.rewards(code);

create table if not exists public.public_rate_limits (
  key_hash text primary key,
  window_start timestamptz not null,
  request_count integer not null
);

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reward_pool enable row level security;
alter table public.rewards enable row level security;
alter table public.public_rate_limits enable row level security;

create or replace function public.check_public_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_count integer;
begin
  if random() < 0.01 then
    delete from public.public_rate_limits where window_start < clock_timestamp() - interval '1 day';
  end if;
  insert into public.public_rate_limits(key_hash, window_start, request_count)
  values (md5(p_key), clock_timestamp(), 1)
  on conflict (key_hash) do update set
    request_count = case
      when public.public_rate_limits.window_start + make_interval(secs => p_window_seconds) <= clock_timestamp() then 1
      else public.public_rate_limits.request_count + 1
    end,
    window_start = case
      when public.public_rate_limits.window_start + make_interval(secs => p_window_seconds) <= clock_timestamp() then clock_timestamp()
      else public.public_rate_limits.window_start
    end
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$$;

create or replace function public.place_order(p_table_number integer, p_instructions text, p_items jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_subtotal integer := 0;
  v_gst integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 40 then
    raise exception 'Invalid order items';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_menu from public.menu_items where id = v_item->>'itemId' and available = true;
    if not found then raise exception 'An item is unavailable'; end if;
    v_subtotal := v_subtotal + v_menu.price * (v_item->>'quantity')::integer;
  end loop;
  v_gst := round(v_subtotal * 0.05);
  insert into public.orders(table_number, instructions, subtotal, gst, total)
  values (p_table_number, coalesce(p_instructions, ''), v_subtotal, v_gst, v_subtotal + v_gst)
  returning id into v_order_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_menu from public.menu_items where id = v_item->>'itemId' and available = true;
    insert into public.order_items(order_id, menu_item_id, name, unit_price, quantity, note)
    values (v_order_id, v_menu.id, v_menu.name, v_menu.price, (v_item->>'quantity')::integer, coalesce(v_item->>'note', ''));
  end loop;
  return v_order_id;
end;
$$;

create or replace function public.scratch_reward(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_pool public.reward_pool%rowtype;
  v_reward public.rewards%rowtype;
  v_total integer;
  v_pick integer;
begin
  if not exists (select 1 from public.orders where id = p_order_id) then raise exception 'Order not found'; end if;
  select * into v_reward from public.rewards where order_id = p_order_id;
  if found then
    return jsonb_build_object('label', v_reward.label, 'code', v_reward.code, 'redemption', v_reward.redemption, 'expiresAt', v_reward.expires_at);
  end if;
  select sum(weight) into v_total from public.reward_pool where active and weight > 0;
  if coalesce(v_total, 0) = 0 then raise exception 'No active reward weights'; end if;
  v_pick := floor(random() * v_total)::integer;
  select p.* into v_pool from public.reward_pool p
  join (
    select id, sum(weight) over (order by id) as running_total from public.reward_pool where active and weight > 0
  ) weighted on weighted.id = p.id
  where weighted.running_total > v_pick order by weighted.running_total limit 1;
  insert into public.rewards(order_id, pool_id, label, code, redemption, expires_at)
  values (
    p_order_id, v_pool.id, v_pool.label,
    case when v_pool.reward_type = 'none' then null else upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)) end,
    v_pool.redemption,
    case when v_pool.redemption = 'this_bill' then now() + interval '2 hours' else now() + interval '60 days' end
  ) returning * into v_reward;
  return jsonb_build_object('label', v_reward.label, 'code', v_reward.code, 'redemption', v_reward.redemption, 'expiresAt', v_reward.expires_at);
end;
$$;

create or replace function public.redeem_reward(p_code text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_reward public.rewards%rowtype;
begin
  update public.rewards set redeemed_at = now()
  where code = upper(p_code) and redeemed_at is null and expires_at > now()
  returning * into v_reward;
  if not found then return null; end if;
  return jsonb_build_object('label', v_reward.label, 'code', v_reward.code, 'redeemedAt', v_reward.redeemed_at);
end;
$$;

revoke all on function public.check_public_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.place_order(integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.scratch_reward(uuid) from public, anon, authenticated;
revoke all on function public.redeem_reward(text) from public, anon, authenticated;
grant execute on function public.check_public_rate_limit(text, integer, integer) to service_role;
grant execute on function public.place_order(integer, text, jsonb) to service_role;
grant execute on function public.scratch_reward(uuid) to service_role;
grant execute on function public.redeem_reward(text) to service_role;

grant all on public.menu_items, public.orders, public.order_items, public.reward_pool, public.rewards, public.public_rate_limits to service_role;
