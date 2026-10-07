-- Phase 4 — Payment Integration foundation
-- Production financial records must be server/database controlled.
-- Amounts are stored in NGN kobo (minor units), never floating point.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  school_name text not null,
  contact_name text not null,
  phone text not null,
  email text,
  total_kobo bigint not null check (total_kobo > 0),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid', 'Failed', 'Refunded')),
  supply_status text not null default 'Pending Supply'
    check (supply_status in ('Pending Supply', 'Assigned', 'Supplied')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid,
  product_name text not null,
  class_name text not null,
  unit_price_kobo bigint not null check (unit_price_kobo > 0),
  quantity integer not null check (quantity > 0),
  line_total_kobo bigint not null check (line_total_kobo > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null default 'paystack'
    check (provider = 'paystack'),
  provider_reference text not null unique,
  provider_transaction_id bigint,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'Pending'
    check (status in ('Pending', 'Paid', 'Failed', 'Refunded')),
  channel text,
  gateway_response text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack'
    check (provider = 'paystack'),
  event_type text not null,
  provider_transaction_id bigint,
  provider_reference text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  processing_error text
);

create unique index if not exists payment_webhook_events_provider_transaction_event
  on public.payment_webhook_events (provider, provider_transaction_id, event_type)
  where provider_transaction_id is not null;

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists payments_order_id_idx
  on public.payments (order_id);

create index if not exists payment_webhook_events_reference_idx
  on public.payment_webhook_events (provider_reference);

-- Payment-linked inventory movements are represented by the existing
-- inventory ledger once production inventory tables are migrated.
-- The final verified-payment transaction must atomically:
-- 1. verify the Paystack transaction,
-- 2. record/update the payment idempotently,
-- 3. mark the order Paid,
-- 4. create the corresponding purchase stock movements exactly once.
