# Project State

## Current Phase
**Phase 7 — Admin Dashboard & Business Visibility**

## Status
**CURRENT — OVERVIEW ACCEPTED & FROZEN**

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

## Phase 4 Payment Acceptance Result
Phase 4 payment integration is accepted and frozen at the current development checkpoint.

Verified:
- Paystack transaction initialization.
- Server-side transaction verification.
- Successful test checkout and callback.
- Signed `charge.success` webhook handling.
- Invalid-signature rejection.
- Idempotent webhook replay handling.
- Exactly-once purchase movement creation for the accepted test order.
- Verified-payment stock reduction.
- Unpaid orders do not consume stock.
- Insufficient remaining stock blocks a later order.

Deferred follow-ups that do not reopen Phase 4:
- Production Paystack credentials/configuration.
- Live payment acceptance during production deployment.
- SMS-provider configuration for phone OTP.
- Numeric email OTP delivery once the hosted provider/rate limit is suitable.

## Phase 5 Result
Phase 5 — Supply Persons & Delivery is **COMPLETE** and frozen.

Manually accepted: supply-person creation/access, paid-order assignment, delivery-code workflow, restricted assigned-order access, and delivery completion without duplicate stock reduction.

## Phase 6 Result
Phase 6 — Customer & Order History is **COMPLETE** and frozen.

Manually accepted: read-only Customer History, Schools, and customer-specific order history derived from existing orders. No customer table, CRM, or account system was added.

## Phase 7 Result
Phase 7 is **CURRENT**. The first controlled slice, Admin Overview, is **COMPLETE for its approved boundary and frozen**.

The Overview uses existing orders, products, and stock movements only. No new business tables or business rules were introduced. The approved Overview must not be changed unless explicitly ordered.

## Not Yet Implemented
- Remaining Phase 7 work, if explicitly approved.
- Phase 8 Security, Testing & Hardening.
- Phase 9 Production Deployment.
- Phase 10 Real Business Pilot.
- Phase 8 Security, Testing & Hardening.
- Phase 9 Production Deployment.
- Phase 10 Real Business Pilot.

## Protected Rules
- PUPILS START has exactly three user dashboards: Admin, Client, and Supply Person.
- The accepted Admin Overview is frozen and must not be changed without an explicit order.
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

The customer order page now starts Paystack checkout through the server-side initialization endpoint, and `/payment/callback` returns to the server-side verification endpoint. The current slice is ready for local Paystack test-mode configuration and manual API/browser acceptance. Email OTP delivery remains paused and must not block payment work.

## Next Task
Configure a Paystack test secret locally, create a test order, initialize the transaction, complete a Paystack test payment, and verify the transaction through the server-side endpoint. Do not implement webhook handling or payment-linked stock reduction until this initialization/verification slice is accepted.


## Paystack Verified-Payment Fulfillment Slice

The Paystack test checkout and server-side verification slice was manually accepted.

Manual acceptance result:
- Customer order was created successfully.
- Paystack Test Checkout opened successfully.
- Test payment completed successfully.
- /payment/callback returned to the application.
- Server-side verification returned Payment: Paid.
- Paystack status returned success.
- Inventory remained unchanged during verification, as required for the pre-fulfillment boundary.

The next protected fulfillment boundary is now implemented:
- POST /api/payment/webhook validates the Paystack x-paystack-signature HMAC-SHA512 signature before processing.
- Only successful charge.success events are fulfillment candidates.
- Supabase function fulfill_paystack_charge_success records webhook events idempotently.
- Stored payment reference, amount, and currency are checked before fulfillment.
- The affected order and product rows are locked during the fulfillment transaction.
- Available stock is calculated from the inventory ledger with purchase movements reducing available stock.
- Purchase movements are linked to the order and are protected by the existing unique purchase index.
- Verified payment fulfillment marks the payment/order Paid and records provider transaction/payment metadata.
- A repeated webhook is treated as already processed and must not create a second purchase movement.
- If stock is insufficient, the fulfillment transaction fails rather than creating negative stock.
- The existing admin stock calculation was aligned so purchase movements reduce available stock.

Migration applied to Supabase development project:
phase4_paystack_webhook_fulfillment

Repository checkpoints:
- ba7410408cfdfaf5491b2d4d7e17561ccf749e83 — feat: add atomic Paystack webhook fulfillment
- fdc7caef9a0e3ed892be855307aa4faf0305fb3b — feat: add Paystack webhook endpoint
- 02c678aad4d43d40bc7d394c6ac0775254cbaf7c — fix: preserve Paystack fulfillment idempotency

## Current Boundary

The Paystack initialization/verification flow is accepted. The webhook fulfillment implementation exists in the repository and the database migration is applied to the development Supabase project.

Before treating payment-linked inventory fulfillment as fully accepted, the next controlled task is local/manual webhook acceptance testing:
1. Send a valid signed charge.success payload to the local webhook endpoint or expose a secure test endpoint as appropriate.
2. Confirm exactly one purchase movement is created per order/product.
3. Confirm available stock decreases by the purchased quantity.
4. Replay the same webhook and confirm stock does not decrease again.
5. Send an invalid signature and confirm HTTP 401 with no database change.
6. Test insufficient stock and confirm the transaction fails without partial purchase movements.

Do not move to Supply Persons/Delivery or later phases until this protected payment fulfillment slice is manually accepted.

## Current Next Task
No new Phase 7 feature is approved yet. Preserve the accepted Overview and wait for an explicit next scope decision. Do not add dashboards, reports, tables, or business logic speculatively.

## Handover Rule
Any new AI/developer session must read this file and the other project documentation before changing the repository.
