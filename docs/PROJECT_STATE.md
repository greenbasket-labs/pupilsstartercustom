# Project State

## Current Phase
**Phase 4 — Payment Integration**

## Status
**IN PROGRESS**

## Repository
- GitHub: `greenbasket-labs/pupilsstartercustom`
- Default branch: `main`
- Technology/development partner: Green Basket Global Ltd.

## Phase 0 Result
Phase 0 — Foundation & Engineering Rules is **COMPLETE**.

Completed:
- Repository established.
- Project README established.
- Engineering rules established.
- Business rules established.
- Roadmap established.
- Architecture boundaries established.
- Safe-change and handover rules established.
- Source-code ownership rule established.

## Phase 1 Result
Phase 1 — Product, Classes & Pricing is **COMPLETE** and frozen.

The catalogue workflow was manually accepted in the development browser, including class/product creation, editing, activation/deactivation, pricing, safe editing against inactive saved classes, removal rules, and confirmation that catalogue data is not hard-coded.

## Phase 2 Result
Phase 2 — Inventory & Incoming Stock is **COMPLETE** and frozen.

The controlled inventory foundation was implemented and manually accepted in the development browser. Stock is represented by a traceable movement ledger, with available/incoming/projected calculations, negative-stock protection, incoming-receipt validation, and history preservation.

Verified-payment stock reduction remains part of the later order/payment workflow.

## Phase 3 Customer Ordering Foundation
The first controlled customer-ordering slice was implemented at `/order`.

Phase 3 browser acceptance is complete and frozen. The original browser-local persistence is now treated only as the historical development bridge.

## Phase 4 Payment Integration Foundation
Phase 4 has started with the production database and server-order foundation.

Implemented:
- Supabase project `pupils-start` is connected for development.
- Payment tables: `orders`, `order_items`, `payments`, `payment_webhook_events`.
- Catalogue tables: `classes`, `products`.
- Inventory ledger: `stock_movements`.
- RLS enabled on exposed public tables.
- No direct public CRUD policies for financial/catalogue/inventory tables.
- Server-side `create_customer_order` database function.
- Server-side catalogue endpoint at `/api/order`.
- Server-side order creation endpoint at `/api/order`.
- Order totals and prices are calculated from database-controlled product prices.
- Available stock is checked server-side before order creation.
- Creating an order does **not** reduce inventory.
- Purchase inventory movements remain reserved for verified payment.
- Service-role credentials are server-only and are represented only by environment variables; no secret is stored in Git.

Current Supabase development project URL:
`https://fftduaexpeeflpletzcl.supabase.co`

Required local/runtime environment variables are documented in `apps/web/.env.example`.

## Important Boundary
The public ordering page no longer treats browser localStorage as the production source of truth for catalogue, prices, stock, or order creation.

The database/server is now authoritative for:
- Product price.
- Product/class availability.
- Available stock.
- Order reference.
- Order total.
- Order persistence.

## Phase 4 Admin Authentication Foundation
Admin authentication foundation is implemented. Phone SMS delivery and numeric email OTP delivery are currently deferred and do not block the Phase 4 admin-data/payment work.

Implemented:
- Supabase Phone OTP sign-in endpoints.
- Supabase Email OTP sign-in endpoints as a second Admin authentication option.
- Server-controlled authorized-admin phone table: `admin_authorized_phones`.
- Server-controlled authorized-admin email table: `admin_authorized_emails`.
- Both authorization tables use RLS and are readable only by the server-side service role.
- HttpOnly access/refresh cookies after OTP verification.
- Server-side admin authorization checks.
- Admin workspace protection for `/` using either authorized phone or email identity.
- Admin API namespace protection for future `/api/admin/*` routes.
- No admin phone number or email address is hard-coded in application source.

Manual development setup:
1. Phone Authentication remains available for later once an SMS provider is configured.
2. For immediate development testing, add an authorized test email to `public.admin_authorized_emails`.
3. Email OTP uses the existing Supabase Email Auth configuration; the hosted project's email template must include `{{ .Token }}` if a numeric OTP is desired.
4. Later, deactivate test identities and add the client's phone/email without changing application code.
5. Keep all service-role credentials server-only.

The Admin Classes, Products, and Inventory workflow has now been migrated to protected Supabase-backed operations. Manual acceptance is complete and the admin-data foundation is accepted and frozen at this checkpoint.

## Not Yet Implemented
- Paystack transaction initialization.
- Paystack test-mode credentials/runtime configuration.
- Paystack transaction verification.
- Paystack webhook endpoint and signature validation.
- Idempotent verified-payment processing.
- Atomic verified-payment inventory reduction.
- Admin production data-entry migration from the browser catalogue to Supabase.
- Production payment acceptance testing.

## Protected Rules
- Preserve completed Phase 0 documentation unless an explicit change request reopens it.
- Preserve completed Phase 1 catalogue functionality unless an explicit change request reopens it.
- Preserve completed Phase 2 inventory functionality unless an explicit change request reopens it.
- Preserve completed Phase 3 customer-ordering functionality unless an explicit change request reopens it.
- Do not hard-code business classes or products into application pages.
- Never expose a Supabase service-role key or Paystack secret key to the browser or Git.
- Do not reduce stock from order creation or unverified payment.

## Admin Data Acceptance Checkpoint
The Supabase-backed Admin Classes, Products, and Inventory workflow was manually accepted in the development browser.

Verified:
- Class create, edit, activate, deactivate, and removal rules.
- Class Edit automatically scrolls to and focuses the edit field.
- Assessment-book create, edit, activate, deactivate, and pricing rules.
- Existing assessment books remain editable against inactive saved classes.
- Assessment-book Edit automatically scrolls to and focuses the edit field.
- Stock Received increases available stock.
- Incoming Stock increases incoming stock without changing available stock.
- Receive Incoming moves incoming quantity into available stock.
- Negative stock movements are rejected.
- Receiving more incoming stock than recorded is rejected.
- Products with stock history cannot be removed.
- Stock history remains preserved.

This checkpoint is accepted and frozen. The service-role grants required by the protected server-side catalogue/inventory API are recorded in `supabase/migrations/0007_phase4_admin_catalogue_service_role_grants.sql`.

## Paystack Transaction Initialization and Verification Slice
Implemented server-side Paystack transaction initialization and verification foundations.

Implemented:
- `PAYSTACK_SECRET_KEY` is server-only and documented in `apps/web/.env.example`.
- `POST /api/payment/initialize` loads the authoritative order total from Supabase and initializes Paystack server-side.
- Payment initialization requires a valid customer email because Paystack requires an email for transaction initialization.
- The Paystack authorization URL/access code are stored with the pending payment record and returned to the browser without exposing the secret key.
- `POST /api/payment/verify` verifies the provider reference server-side and checks reference, amount, and currency against the stored payment record.
- Successful verification marks the payment and order as Paid.
- Pending/in-progress provider states remain Pending; failed/abandoned/reversed states become Failed.
- No inventory is reduced by initialization or verification. Verified-payment inventory reduction remains a later atomic webhook/fulfillment slice.

The current slice is ready for local Paystack test-mode configuration and manual API/browser acceptance. Email OTP delivery remains paused and must not block payment work.

## Next Task
Configure a Paystack test secret locally, create a test order, initialize the transaction, complete a Paystack test payment, and verify the transaction through the server-side endpoint. Do not implement webhook handling or payment-linked stock reduction until this initialization/verification slice is accepted.

## Handover Rule
Any new AI/developer session must read this file and the other project documentation before changing the repository.
