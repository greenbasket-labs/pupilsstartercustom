# Project State

## Current Phase
**Phase 7 — Admin Dashboard & Business Visibility**

## Status
**CURRENT — ADMIN OVERVIEW ACCEPTED & FROZEN**

## Repository
- GitHub: `greenbasket-labs/pupilsstartercustom`
- Default branch: `main`
- Technology/development partner: Green Basket Global Ltd.

## Accepted Phase Results

### Phase 0 — Foundation & Engineering Rules
**COMPLETE**

Project documentation, engineering rules, business rules, architecture boundaries, safe-change rules, handover rules, and source-code ownership boundaries are established.

### Phase 1 — Product, Classes & Pricing
**COMPLETE & FROZEN**

Catalogue creation, editing, activation/deactivation, pricing, class/product relationships, safe editing against inactive classes, and removal rules were manually accepted.

### Phase 2 — Inventory & Incoming Stock
**COMPLETE & FROZEN**

The inventory ledger, available/incoming/projected stock calculations, incoming receipts, negative-stock protection, and history preservation were manually accepted.

### Phase 3 — Customer Ordering
**COMPLETE & FROZEN**

Public ordering, customer information capture, order references, item/quantity capture, and the rule that unpaid/unverified orders do not consume stock were manually accepted.

### Phase 4 — Payment Integration
**COMPLETE & FROZEN**

Manually accepted:
- Paystack server-side transaction initialization.
- Server-side transaction verification.
- Successful test checkout and callback.
- Signed `charge.success` webhook handling.
- Invalid-signature rejection.
- Idempotent webhook replay handling.
- Exactly-once purchase movement creation for the accepted test order.
- Verified-payment stock reduction.
- Unpaid orders do not consume stock.
- Insufficient remaining stock blocks a later order.

Deferred deployment/authentication follow-ups do not reopen Phase 4:
- Production Paystack credentials/configuration.
- Live payment acceptance during production deployment.
- SMS-provider configuration for phone OTP.
- Numeric email OTP delivery while the hosted provider/rate limit is unsuitable.

### Phase 5 — Supply Persons & Delivery
**COMPLETE & FROZEN**

Manually accepted:
- Supply-person creation and restricted access.
- Assignment of paid orders.
- System-generated six-digit delivery code.
- Assigned-order-only visibility.
- Purchase/order-code confirmation path.
- Mark Delivered path.
- Successful supply completion without duplicate stock reduction.

Supply states remain:
`Pending Supply → Assigned → Supplied`

No additional supply states were introduced.

### Phase 6 — Customer & Order History
**COMPLETE & FROZEN**

Manually accepted:
- Read-only Customer History.
- Read-only Schools view derived from existing orders.
- Customer-specific order history.
- Payment/supply history visibility.

No customer table, CRM, or customer account system was added.

## Phase 7 — Admin Dashboard & Business Visibility
**CURRENT — FIRST SLICE ACCEPTED & FROZEN**

The approved Admin Overview is complete for its current boundary.

It uses existing:
- Orders.
- Products.
- Stock movements.

It introduces:
- No new database tables.
- No new business rules.
- No new dependencies.
- No changes to accepted payment, inventory, supply, or order logic.

### Accepted Overview metrics
- Total Orders.
- Paid Orders.
- Pending Supply.
- Supplied Orders.
- Paid Order Value.
- Available Stock.
- Incoming Stock.
- Active Assessment Books.

Manual acceptance snapshot:
- Total Orders: **1**
- Paid Orders: **1**
- Pending Supply: **0**
- Supplied Orders: **1**
- Paid Order Value: **₦2,600**
- Available Stock: **2,546**
- Incoming Stock: **270**
- Active Assessment Books: **11**

The snapshot above records the test checkpoint only; the Overview calculates live values from the database.

## Protected Dashboard Boundary
PUPILS START has exactly three dashboards:
1. **Admin dashboard** — business operations.
2. **Client dashboard** — school/customer ordering and history.
3. **Supply Person dashboard** — assigned supply and delivery actions.

No fourth dashboard is to be introduced without an explicit business decision.

## Protected Rules
- The accepted Admin Overview is frozen and must not be changed without an explicit order.
- Completed phases remain protected unless explicitly reopened.
- Do not hard-code business classes or products into application pages.
- Never expose Supabase service-role or Paystack secret credentials to the browser or Git.
- Do not reduce stock from order creation or unverified payment.
- Payment and physical supply remain independent.
- Repeated payment-provider events must not create duplicate purchase movements.
- Preserve orders, payments, stock movements, supply history, and other important business history.

## Not Yet Implemented
- Any additional Phase 7 feature not yet explicitly approved.
- Phase 8 — Security, Testing & Hardening.
- Phase 9 — Production Deployment.
- Phase 10 — Real Business Pilot.

## Current Next Task
**No new Phase 7 feature is approved yet.**

Preserve the accepted Admin Overview and wait for an explicit scope decision. Do not add dashboards, reports, tables, business logic, or redesigns speculatively.

## Handover Rule
Any new AI/developer session must read this file, `README.md`, `docs/ROADMAP.md`, `docs/ENGINEERING_RULES.md`, `docs/BUSINESS_RULES.md`, and `docs/ARCHITECTURE.md` before changing the repository.
