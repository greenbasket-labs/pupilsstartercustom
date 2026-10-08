-- Phase 4B — protected Admin catalogue and inventory operations
-- Business writes remain server-controlled. Critical inventory validation is
-- performed under a product-row lock so concurrent admin writes cannot race.

create or replace function public.admin_create_class(p_name text)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Class name is required';
  end if;

  insert into public.classes(name)
  values (trim(p_name))
  returning * into v_class;

  return v_class;
end;
$$;

create or replace function public.admin_update_class(p_id uuid, p_name text)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Class name is required';
  end if;

  update public.classes
  set name = trim(p_name), updated_at = now()
  where id = p_id
  returning * into v_class;

  if not found then
    raise exception 'Class not found';
  end if;

  return v_class;
end;
$$;

create or replace function public.admin_set_class_active(p_id uuid, p_is_active boolean)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes;
begin
  update public.classes
  set is_active = p_is_active, updated_at = now()
  where id = p_id
  returning * into v_class;

  if not found then
    raise exception 'Class not found';
  end if;

  return v_class;
end;
$$;

create or replace function public.admin_delete_class(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.products where class_id = p_id) then
    raise exception 'Remove or reassign the products under this class first';
  end if;

  delete from public.classes where id = p_id;

  if not found then
    raise exception 'Class not found';
  end if;
end;
$$;

create or replace function public.admin_create_product(
  p_name text,
  p_class_id uuid,
  p_price_kobo bigint
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Assessment book name is required';
  end if;

  if p_price_kobo is null or p_price_kobo <= 0 then
    raise exception 'Price must be greater than zero';
  end if;

  if not exists (
    select 1 from public.classes
    where id = p_class_id and is_active = true
  ) then
    raise exception 'Select a saved active class';
  end if;

  insert into public.products(name, class_id, price_kobo)
  values (trim(p_name), p_class_id, p_price_kobo)
  returning * into v_product;

  return v_product;
end;
$$;

create or replace function public.admin_update_product(
  p_id uuid,
  p_name text,
  p_class_id uuid,
  p_price_kobo bigint
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Assessment book name is required';
  end if;

  if p_price_kobo is null or p_price_kobo <= 0 then
    raise exception 'Price must be greater than zero';
  end if;

  if not exists (select 1 from public.classes where id = p_class_id) then
    raise exception 'Select a saved class';
  end if;

  update public.products
  set name = trim(p_name),
      class_id = p_class_id,
      price_kobo = p_price_kobo,
      updated_at = now()
  where id = p_id
  returning * into v_product;

  if not found then
    raise exception 'Assessment book not found';
  end if;

  return v_product;
end;
$$;

create or replace function public.admin_set_product_active(
  p_id uuid,
  p_is_active boolean
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  update public.products
  set is_active = p_is_active, updated_at = now()
  where id = p_id
  returning * into v_product;

  if not found then
    raise exception 'Assessment book not found';
  end if;

  return v_product;
end;
$$;

create or replace function public.admin_delete_product(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.stock_movements where product_id = p_id) then
    raise exception 'This assessment book has stock history and cannot be removed';
  end if;

  delete from public.products where id = p_id;

  if not found then
    raise exception 'Assessment book not found';
  end if;
end;
$$;

create or replace function public.admin_record_stock_movement(
  p_product_id uuid,
  p_kind text,
  p_quantity integer,
  p_note text default null
)
returns public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movement public.stock_movements;
  v_available integer;
  v_incoming integer;
begin
  if p_kind not in ('received', 'incoming', 'incoming_received', 'adjustment') then
    raise exception 'Invalid admin stock movement';
  end if;

  if p_quantity is null or p_quantity = 0 then
    raise exception 'Stock quantity must be non-zero';
  end if;

  if p_kind <> 'adjustment' and p_quantity < 0 then
    raise exception 'Stock quantity must be positive for this movement';
  end if;

  if p_kind = 'adjustment' and nullif(trim(p_note), '') is null then
    raise exception 'A reason is required for a stock adjustment';
  end if;

  perform 1 from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Assessment book not found';
  end if;

  select
    coalesce(sum(case
      when kind in ('received', 'incoming_received', 'adjustment', 'purchase')
        then quantity
      else 0
    end), 0)::integer,
    coalesce(sum(case
      when kind = 'incoming' then quantity
      when kind = 'incoming_received' then -quantity
      else 0
    end), 0)::integer
  into v_available, v_incoming
  from public.stock_movements
  where product_id = p_product_id;

  if p_kind = 'adjustment' and v_available + p_quantity < 0 then
    raise exception 'This adjustment cannot reduce available stock below zero';
  end if;

  if p_kind = 'incoming_received' and v_incoming - p_quantity < 0 then
    raise exception 'You cannot receive more incoming stock than is recorded';
  end if;

  insert into public.stock_movements(product_id, kind, quantity, note)
  values (p_product_id, p_kind, p_quantity, nullif(trim(p_note), ''))
  returning * into v_movement;

  return v_movement;
end;
$$;

revoke all on function public.admin_create_class(text) from public, anon, authenticated;
revoke all on function public.admin_update_class(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_set_class_active(uuid, boolean) from public, anon, authenticated;
revoke all on function public.admin_delete_class(uuid) from public, anon, authenticated;
revoke all on function public.admin_create_product(text, uuid, bigint) from public, anon, authenticated;
revoke all on function public.admin_update_product(uuid, text, uuid, bigint) from public, anon, authenticated;
revoke all on function public.admin_set_product_active(uuid, boolean) from public, anon, authenticated;
revoke all on function public.admin_delete_product(uuid) from public, anon, authenticated;
revoke all on function public.admin_record_stock_movement(uuid, text, integer, text) from public, anon, authenticated;

grant execute on function public.admin_create_class(text) to service_role;
grant execute on function public.admin_update_class(uuid, text) to service_role;
grant execute on function public.admin_set_class_active(uuid, boolean) to service_role;
grant execute on function public.admin_delete_class(uuid) to service_role;
grant execute on function public.admin_create_product(text, uuid, bigint) to service_role;
grant execute on function public.admin_update_product(uuid, text, uuid, bigint) to service_role;
grant execute on function public.admin_set_product_active(uuid, boolean) to service_role;
grant execute on function public.admin_delete_product(uuid) to service_role;
grant execute on function public.admin_record_stock_movement(uuid, text, integer, text) to service_role;