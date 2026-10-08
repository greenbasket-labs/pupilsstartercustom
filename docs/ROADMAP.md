# Roadmap

## Phase 0 — Foundation & Engineering Rules
**Status: COMPLETE**
- Project documentation.
- Engineering constitution.
- Business rules.
- Architecture boundaries.
- Safe-change workflow.
- Git checkpoints.

## Phase 1 — Product, Classes & Pricing
**Status: COMPLETE & FROZEN**
- Product catalogue.
- Class/category structure.
- Product pricing and availability.
- Admin product management.
- Manual acceptance completed.

## Phase 2 — Inventory & Incoming Stock
**Status: COMPLETE & FROZEN**
- Available stock.
- Incoming stock.
- Stock movement ledger.
- Stock history.
- Safe stock calculations.
- Negative-stock protection.
- Inventory history preservation.
- Manual acceptance completed.

## Phase 3 — Customer Ordering
**Status: COMPLETE & FROZEN**
- Public customer catalogue.
- Product/quantity selection.
- Customer information.
- Order creation and references.
- Customer order confirmation.
- Unpaid orders do not consume stock.
- Manual acceptance completed.

## Phase 4 — Payment Integration
**Status: COMPLETE & FROZEN**
- Paystack transaction initialization.
- Server-side verification.
- Signed webhook handling.
- Idempotency.
- Automatic payment status.
- Payment records.
- Verified-payment stock reduction.
- Insufficient-stock protection.
- Unpaid orders do not reserve/consume stock.
- Manual acceptance completed.
- Production credentials/configuration remain a deployment-phase task.
- SMS and numeric email OTP delivery remain deferred authentication follow-ups.

## Phase 5 — Supply Persons & Delivery
**Status: COMPLETE & FROZEN**
- Admin creates supply persons.
- Admin assigns paid orders.
- Supply person sees assigned orders only.
- System-generated six-digit delivery code.
- Purchase/order-code confirmation.
- Mark Delivered.
- Existing supply states remain `Pending Supply → Assigned → Supplied`.
- Manual acceptance completed.

## Phase 6 — Customer & Order History
**Status: COMPLETE & FROZEN**
- Read-only Customer History derived from orders.
- Read-only Schools view derived from orders.
- Customer-specific order history.
- Payment/supply history.
- No customer table, CRM, or account system added.
- Manual acceptance completed.

## Phase 7 — Admin Dashboard & Business Visibility
**Status: CURRENT — FIRST SLICE ACCEPTED & FROZEN**

Accepted first slice:
- Admin Overview.
- Existing-data-only metrics.
- Simple operational links.
- No new database tables.
- No new business rules.
- No new dependencies.
- No redesign of the accepted Overview.

Accepted metrics:
- Total Orders.
- Paid Orders.
- Pending Supply.
- Supplied Orders.
- Paid Order Value.
- Available Stock.
- Incoming Stock.
- Active Assessment Books.

**Important:** the accepted Overview is frozen. Do not change its metrics, layout, navigation placement, names, or behavior without an explicit order.

## Phase 8 — Security, Testing & Hardening
**Status: NOT STARTED**
- Authorization review.
- Critical workflow tests.
- Audit logging.
- Error handling.
- Backup/recovery verification.
- Performance/security review.

## Phase 9 — Production Deployment
**Status: NOT STARTED**
- Production environment.
- Domain.
- Hosting.
- Database.
- Production payment configuration.
- Monitoring.
- Backup strategy.

## Phase 10 — Real Business Pilot
**Status: NOT STARTED**
- Pilot launch.
- Business-user testing.
- Bug fixes.
- Workflow validation.
- Final v1 acceptance.

## Current Position
Phase 7 is current. Phase 5 and Phase 6 are complete and frozen. The first Phase 7 Admin Overview slice is accepted and frozen.

## Next Work Rule
No additional Phase 7 feature is approved at this checkpoint. The next implementation must be explicitly selected before code changes begin.

Do not jump to a later phase because it appears useful. Do not reopen a completed phase without an explicit change request and impact review.

## Documentation Rule
Any accepted change must update the relevant project documentation and create a stable Git checkpoint.
