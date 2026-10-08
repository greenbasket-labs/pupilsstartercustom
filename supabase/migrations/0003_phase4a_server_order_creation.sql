-- Phase 4A — server-side customer order creation
-- Server-controlled order totals and stock validation. Order creation does not
-- reduce inventory; verified payment will create purchase movements later.

create or replace function public.create_customer_order(
  p_school_name text,
  p_contact_name text,
  p_phone text,
  p_email text,
  p_items jsonb
)
returns table (order_id uuid, reference text, total_kobo bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_reference text := 'PS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_total bigint := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_class_name text;
  v_product_id uuid;
  v_quantity integer;
  v_available integer;
  v_line_total bigint;
begin
  if nullif(trim(p_school_name), '') is null
     or nullif(trim(p_contact_name), '') is null
     or nullif(trim(p_phone), '') is null then
    raise exception 'School name, contact name, and phone are required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one order item is required';
  end if;

  insert into public.orders(id, reference, school_name, contact_name, phone, email, total_kobo)
  values(v_order_id, v_reference, trim(p_school_name), trim(p_contact_name), trim(p_phone), nullif(trim(p_email), ''), 1);

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Order quantity must be a positive whole number';
    end if;

    select * into v_product from public.products
    where id = v_product_id and is_active = true for update;
    if not found then raise exception 'Selected assessment book is unavailable'; end if;

    select c.name into v_class_name from public.classes c
    where c.id = v_product.class_id and c.is_active = true;
    if v_class_name is null then raise exception 'Selected assessment book class is unavailable'; end if;

    select coalesce(sum(case
      when kind = 'received' then quantity
      when kind = 'incoming_received' then quantity
      when kind = 'adjustment' then quantity
      when kind = 'purchase' then quantity
      else 0 end), 0)::integer
    into v_available
    from public.stock_movements where product_id = v_product.id;

    if v_available < v_quantity then raise exception 'Insufficient stock for %', v_product.name; end if;

    v_line_total := v_product.price_kobo * v_quantity;
    v_total := v_total + v_line_total;

    insert into public.order_items(id, order_id, product_id, product_name, class_name, unit_price_kobo, quantity, line_total_kobo)
    values(gen_random_uuid(), v_order_id, v_product.id, v_product.name, v_class_name, v_product.price_kobo, v_quantity, v_line_total);
  end loop;

  if v_total <= 0 then raise exception 'Order total must be greater than zero'; end if;
  update public.orders set total_kobo = v_total where id = v_order_id;
  return query select v_order_id, v_reference, v_total;
end;
$$;

revoke all on function public.create_customer_order(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_customer_order(text, text, text, text, jsonb) to service_role;
