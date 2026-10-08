-- Phase 4 — Paystack webhook fulfillment and atomic verified-payment stock reduction
-- The Paystack webhook is the protected fulfillment boundary.
-- A signed charge.success event is processed once and stock is reduced atomically.

create or replace function public.fulfill_paystack_charge_success(
  p_event_type text,
  p_provider_transaction_id bigint,
  p_provider_reference text,
  p_amount_kobo bigint,
  p_currency text,
  p_channel text,
  p_gateway_response text,
  p_paid_at timestamptz,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events;
  v_payment public.payments;
  v_order public.orders;
  v_item record;
  v_available integer;
  v_event_status text;
  v_paid_at timestamptz := coalesce(p_paid_at, now());
begin
  if nullif(trim(p_event_type), '') is null
     or p_provider_transaction_id is null
     or nullif(trim(p_provider_reference), '') is null
     or p_amount_kobo is null
     or p_amount_kobo <= 0
     or upper(trim(coalesce(p_currency, ''))) <> 'NGN' then
    raise exception 'Invalid Paystack webhook payment data';
  end if;

  insert into public.payment_webhook_events(
    provider,
    event_type,
    provider_transaction_id,
    provider_reference,
    payload,
    processing_status
  )
  values (
    'paystack',
    trim(p_event_type),
    p_provider_transaction_id,
    trim(p_provider_reference),
    p_payload,
    'received'
  )
  on conflict (provider, provider_transaction_id, event_type)
    where provider_transaction_id is not null
    do nothing;

  select *
  into v_event
  from public.payment_webhook_events
  where provider = 'paystack'
    and event_type = trim(p_event_type)
    and provider_transaction_id = p_provider_transaction_id
  for update;

  if not found then
    raise exception 'Unable to record Paystack webhook event';
  end if;

  v_event_status := v_event.processing_status;

  if v_event_status = 'processed' then
    return jsonb_build_object(
      'alreadyProcessed', true,
      'inventoryReduced', true
    );
  end if;

  select *
  into v_payment
  from public.payments
  where provider = 'paystack'
    and provider_reference = trim(p_provider_reference)
  for update;

  if not found then
    update public.payment_webhook_events
    set processing_status = 'ignored',
        processing_error = 'Payment record not found',
        processed_at = now()
    where id = v_event.id;

    return jsonb_build_object(
      'alreadyProcessed', false,
      'inventoryReduced', false,
      'ignored', true
    );
  end if;

  if v_payment.amount_kobo <> p_amount_kobo
     or upper(trim(v_payment.currency)) <> upper(trim(p_currency))
     or v_payment.provider_reference <> trim(p_provider_reference) then
    raise exception 'Paystack webhook does not match the stored payment';
  end if;

  select *
  into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  if not found then
    raise exception 'Order for payment was not found';
  end if;

  if v_payment.status = 'Paid' then
    update public.payment_webhook_events
    set processing_status = 'processed',
        processing_error = null,
        processed_at = now()
    where id = v_event.id;

    return jsonb_build_object(
      'alreadyProcessed', true,
      'inventoryReduced', true
    );
  end if;

  if trim(p_event_type) <> 'charge.success' then
    update public.payment_webhook_events
    set processing_status = 'ignored',
        processing_error = 'Unsupported Paystack event type',
        processed_at = now()
    where id = v_event.id;

    return jsonb_build_object(
      'alreadyProcessed', false,
      'inventoryReduced', false,
      'ignored', true
    );
  end if;

  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = v_payment.order_id
    order by product_id
  loop
    if v_item.product_id is null then
      raise exception 'Order item is missing its product reference';
    end if;

    perform 1
    from public.products
    where id = v_item.product_id
    for update;

    if not found then
      raise exception 'Order item product was not found';
    end if;

    select coalesce(sum(case
      when kind in ('received', 'incoming_received', 'adjustment')
        then quantity
      when kind = 'purchase'
        then -quantity
      else 0
    end), 0)::integer
    into v_available
    from public.stock_movements
    where product_id = v_item.product_id;

    if v_available < v_item.quantity then
      raise exception 'Insufficient available stock for verified payment';
    end if;

    insert into public.stock_movements(
      product_id,
      kind,
      quantity,
      note,
      order_id
    )
    values (
      v_item.product_id,
      'purchase',
      v_item.quantity,
      'Verified Paystack payment ' || trim(p_provider_reference),
      v_payment.order_id
    )
    on conflict (order_id, product_id)
      where kind = 'purchase'
      do nothing;
  end loop;

  update public.payments
  set provider_transaction_id = p_provider_transaction_id,
      status = 'Paid',
      channel = p_channel,
      gateway_response = p_gateway_response,
      paid_at = v_paid_at,
      updated_at = now()
  where id = v_payment.id;

  update public.orders
  set payment_status = 'Paid',
      paid_at = v_paid_at
  where id = v_payment.order_id;

  update public.payment_webhook_events
  set processing_status = 'processed',
      processing_error = null,
      processed_at = now()
  where id = v_event.id;

  return jsonb_build_object(
    'alreadyProcessed', false,
    'inventoryReduced', true,
    'orderId', v_payment.order_id,
    'paymentId', v_payment.id
  );
exception
  when others then
    update public.payment_webhook_events
    set processing_status = 'failed',
        processing_error = sqlerrm
    where id = v_event.id;

    raise;
end;
$$;

revoke all on function public.fulfill_paystack_charge_success(
  text,
  bigint,
  text,
  bigint,
  text,
  text,
  text,
  timestamptz,
  jsonb
) from public, anon, authenticated;

grant execute on function public.fulfill_paystack_charge_success(
  text,
  bigint,
  text,
  bigint,
  text,
  text,
  text,
  timestamptz,
  jsonb
) to service_role;

-- Keep the existing inventory validation aligned with the ledger meaning:
-- purchase quantities are positive sold quantities and therefore reduce
-- available stock when calculating the current balance.
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
      when kind in ('received', 'incoming_received', 'adjustment')
        then quantity
      when kind = 'purchase'
        then -quantity
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

revoke all on function public.admin_record_stock_movement(uuid, text, integer, text)
  from public, anon, authenticated;

grant execute on function public.admin_record_stock_movement(uuid, text, integer, text)
  to service_role;
