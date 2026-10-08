-- Phase 4 — Paystack transaction initialization and verification foundation
-- Payment initialization/verification is server-side. No inventory reduction occurs here.

alter table public.payments
  add column if not exists provider_access_code text,
  add column if not exists authorization_url text;

grant select, insert, update on table public.orders to service_role;
grant select, insert, update on table public.order_items to service_role;
grant select, insert, update on table public.payments to service_role;
grant select, insert, update on table public.payment_webhook_events to service_role;
