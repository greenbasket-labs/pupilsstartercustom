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

## Next Task
Continue Phase 4 with the controlled Paystack test-mode integration after local/runtime Supabase configuration is supplied and the server-side ordering slice is manually validated.

## Handover Rule
Any new AI/developer session must read this file and the other project documentation before changing the repository.
