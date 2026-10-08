-- Phase 5 — Supply Persons & Delivery
-- Keeps payment state separate from physical supply state.
-- Delivery code is optional confirmation; Mark Delivered remains the primary handover action.

create table if not exists public.supply_persons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  access_token_hash text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists supply_person_id uuid references public.supply_persons(id) on delete restrict,
  add column if not exists delivery_code text,
  add column if not exists supplied_at timestamptz;

create index if not exists orders_supply_person_id_idx
  on public.orders (supply_person_id);

create index if not exists orders_supply_status_idx
  on public.orders (supply_status);

alter table public.supply_persons enable row level security;

revoke all on table public.supply_persons from anon, authenticated;
grant select, insert, update on table public.supply_persons to service_role;
grant select, update on table public.orders to service_role;

create or replace function public.admin_create_supply_person(
  p_name text,
  p_phone text,
  p_access_token_hash text
)
returns public.supply_persons
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person public.supply_persons;
begin
  if nullif(trim(p_name), '') is null or nullif(trim(p_phone), '') is null then
    raise exception 'Supply-person name and phone are required';
  end if;

  if nullif(trim(p_access_token_hash), '') is null then
    raise exception 'Supply-person access token is required';
  end if;

  insert into public.supply_persons(name, phone, access_token_hash)
  values (trim(p_name), trim(p_phone), trim(p_access_token_hash))
  returning * into v_person;

  return v_person;
end;
$$;

create or replace function public.admin_set_supply_person_active(
  p_id uuid,
  p_is_active boolean
)
returns public.supply_persons
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person public.supply_persons;
begin
  update public.supply_persons
  set is_active = p_is_active, updated_at = now()
  where id = p_id
  returning * into v_person;

  if not found then
    raise exception 'Supply person not found';
  end if;

  return v_person;
end;
$$;

create or replace function public.admin_assign_supply_person(
  p_order_id uuid,
  p_supply_person_id uuid,
  p_delivery_code text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if nullif(trim(p_delivery_code), '') is null then
    raise exception 'Delivery code is required';
  end if;

  perform 1
  from public.supply_persons
  where id = p_supply_person_id
    and is_active = true;

  if not found then
    raise exception 'Supply person is unavailable';
  end if;

  update public.orders
  set supply_person_id = p_supply_person_id,
      delivery_code = trim(p_delivery_code),
      supply_status = 'Assigned'
  where id = p_order_id
    and supply_status <> 'Supplied'
  returning * into v_order;

  if not found then
    raise exception 'Order not found or already supplied';
  end if;

  return v_order;
end;
$$;

create or replace function public.admin_mark_order_supplied(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  update public.orders
  set supply_status = 'Supplied',
      supplied_at = now()
  where id = p_order_id
    and supply_status = 'Assigned'
    and payment_status = 'Paid'
  returning * into v_order;

  if not found then
    raise exception 'Only an assigned paid order can be marked supplied';
  end if;

  return v_order;
end;
$$;

create or replace function public.school_confirm_delivery_code(
  p_reference text,
  p_delivery_code text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select *
  into v_order
  from public.orders
  where reference = trim(p_reference)
    and delivery_code = trim(p_delivery_code)
    and supply_status = 'Assigned'
    and payment_status = 'Paid'
  for update;

  if not found then
    raise exception 'Order reference or delivery code is invalid';
  end if;

  update public.orders
  set supply_status = 'Supplied',
      supplied_at = now()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.supply_person_orders(
  p_access_token_hash text
)
returns table (
  order_id uuid,
  reference text,
  school_name text,
  contact_name text,
  phone text,
  payment_status text,
  supply_status text,
  delivery_code text,
  total_kobo bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    o.id,
    o.reference,
    o.school_name,
    o.contact_name,
    o.phone,
    o.payment_status,
    o.supply_status,
    o.delivery_code,
    o.total_kobo,
    o.created_at
  from public.orders o
  join public.supply_persons sp on sp.id = o.supply_person_id
  where sp.access_token_hash = trim(p_access_token_hash)
    and sp.is_active = true
    and o.supply_status = 'Assigned'
  order by o.created_at desc;
end;
$$;

create or replace function public.supply_person_mark_delivered(
  p_access_token_hash text,
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  update public.orders o
  set supply_status = 'Supplied',
      supplied_at = now()
  from public.supply_persons sp
  where o.id = p_order_id
    and o.supply_person_id = sp.id
    and sp.access_token_hash = trim(p_access_token_hash)
    and sp.is_active = true
    and o.supply_status = 'Assigned'
    and o.payment_status = 'Paid'
  returning o.* into v_order;

  if not found then
    raise exception 'Assigned paid order not found';
  end if;

  return v_order;
end;
$$;

revoke all on function public.admin_create_supply_person(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_supply_person_active(uuid, boolean) from public, anon, authenticated;
revoke all on function public.admin_assign_supply_person(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_mark_order_supplied(uuid) from public, anon, authenticated;
revoke all on function public.school_confirm_delivery_code(text, text) from public, anon, authenticated;
revoke all on function public.supply_person_orders(text) from public, anon, authenticated;
revoke all on function public.supply_person_mark_delivered(text, uuid) from public, anon, authenticated;

grant execute on function public.admin_create_supply_person(text, text, text) to service_role;
grant execute on function public.admin_set_supply_person_active(uuid, boolean) to service_role;
grant execute on function public.admin_assign_supply_person(uuid, uuid, text) to service_role;
grant execute on function public.admin_mark_order_supplied(uuid) to service_role;
grant execute on function public.school_confirm_delivery_code(text, text) to service_role;
grant execute on function public.supply_person_orders(text) to service_role;
grant execute on function public.supply_person_mark_delivered(text, uuid) to service_role;
