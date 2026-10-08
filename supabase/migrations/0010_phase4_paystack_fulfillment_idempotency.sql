-- Phase 4 — finalize Paystack fulfillment idempotency
-- Payment verification may mark a payment Paid before the webhook arrives.
-- A Paid payment is therefore not sufficient evidence that inventory was reduced.

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
  v_item record;
  v_available integer;
  v_has_purchase boolean;
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
    provider, event_type, provider_transaction_id, provider_reference, payload, processing_status
  )
  values (
    'paystack', trim(p_event_type), p_provider_transaction_id, trim(p_provider_reference), p_payload, 'received'
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

  if v_event.processing_status = 'processed' then
    return jsonb_build_object('alreadyProcessed', true, 'inventoryReduced', true);
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

    return jsonb_build_object('alreadyProcessed', false, 'inventoryReduced', false, 'ignored', true);
  end if;

  if v_payment.amount_kobo <> p_amount_kobo
     or upper(trim(v_payment.currency)) <> upper(trim(p_currency))
     or v_payment.provider_reference <> trim(p_provider_reference) then
    raise exception 'Paystack webhook does not match the stored payment';
  end if;

  if trim(p_event_type) <> 'charge.success' then
    update public.payment_webhook_events
    set processing_status = 'ignored',
        processing_error = 'Unsupported Paystack event type',
        processed_at = now()
    where id = v_event.id;

    return jsonb_build_object('alreadyProcessed', false, 'inventoryReduced', false, 'ignored', true);
  end if;

  select exists (
    select 1
    from public.stock_movements
    where order_id = v_payment.order_id
      and kind = 'purchase'
  )
  into v_has_purchase;

  if v_has_purchase then
    update public.payment_webhook_events
    set processing_status = 'processed',
        processing_error = null,
        processed_at = now()
    where id = v_event.id;

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

    return jsonb_build_object('alreadyProcessed', true, 'inventoryReduced', true);
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

    perform 1 from public.products where id = v_item.product_id for update;
    if not found then
      raise exception 'Order item product was not found';
    end if;

    select coalesce(sum(case
      when kind in ('received', 'incoming_received', 'adjustment') then quantity
      when kind = 'purchase' then -quantity
      else 0
    end), 0)::integer
    into v_available
    from public.stock_movements
    where product_id = v_item.product_id;

    if v_available < v_item.quantity then
      raise exception 'Insufficient available stock for verified payment';
    end if;

    insert into public.stock_movements(product_id, kind, quantity, note, order_id)
    values (
      v_item.product_id,
      'purchase',
      v_item.quantity,
      'Verified Paystack payment ' || trim(p_provider_reference),
      v_payment.order_id
    );
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
    if v_event.id is not null then
      update public.payment_webhook_events
      set processing_status = 'failed',
          processing_error = sqlerrm
      where id = v_event.id;
    end if;
    raise;
end;
$$;

revoke all on function public.fulfill_paystack_charge_success(
  text, bigint, text, bigint, text, text, text, timestamptz, jsonb
) from public, anon, authenticated;

grant execute on function public.fulfill_paystack_charge_success(
  text, bigint, text, bigint, text, text, text, timestamptz, jsonb
) to service_role;
