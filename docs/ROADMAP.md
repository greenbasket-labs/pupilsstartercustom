# Roadmap

## Phase 0 — Foundation & Engineering Rules
**Status: COMPLETE**
- Project documentation established.
- Engineering constitution established.
- Business rules established.
- Architecture boundaries established.
- Safe-change workflow established.
- Git checkpoint established.

## Phase 1 — Product, Classes & Pricing
**Status: COMPLETE**
- Web application foundation.
- Product catalogue.
- Class/category structure.
- Product pricing.
- Product availability states.
- Admin product management.
- Tests and documentation.
- Manual acceptance completed.

## Phase 2 — Inventory & Incoming Stock
**Status: COMPLETE**
- Available stock.
- Incoming stock.
- Stock movements/ledger.
- Stock history.
- Safe stock calculations.
- Inventory ledger foundation implemented in the development browser.
- Manual acceptance completed.
- Negative-stock protection verified.
- Inventory history preservation verified.
- Verified-purchase stock rules documented for the later order/payment flow.

## Phase 3 — Customer Ordering
**Status: COMPLETE**
- Public customer catalogue.
- Product selection.
- Quantity selection.
- Customer basic information.
- Order creation.
- Order reference.
- Customer order confirmation.
- Initial browser-based customer ordering slice implemented.
- Manual browser acceptance completed.
- Lint and production build validation completed.
- Payment deliberately excluded from this phase.
- Creating an order does not reduce inventory.
- Phase 3 is frozen at the accepted boundary.

## Phase 4 — Payment Integration
**Status: COMPLETE**
- Payment provider integration.
- Payment verification.
- Webhook handling.
- Idempotency.
- Automatic payment status.
- Payment records.
- Verified-payment stock reduction linked to the corresponding order/payment history.
- Unpaid orders do not consume/reserve stock; verified paid orders reduce available stock and can block later orders when remaining stock is insufficient.
- Server/database payment foundation schema implemented.
- Financial amounts represented in NGN kobo (minor units).
- Payment webhook event idempotency foundation implemented.
- Paystack test checkout, server-side verification, signed webhook fulfillment, idempotency, and payment-linked inventory reduction have been manually acceptance-tested. Production credentials/configuration remain a deployment-phase task.
- Controlled acceptance test passed for the stock boundary: an unpaid order leaves available stock unchanged; after simulated verified purchase consumption, a subsequent order exceeding remaining stock is rejected.
- Customer order stock validation is aligned with the purchase-ledger semantics in migration `0012_phase4_order_stock_validation.sql`.
- Admin phone/OTP authorization foundation implemented; SMS-provider acceptance remains pending.
- Admin email/OTP authorization foundation added as a second sign-in option; email delivery/acceptance is currently paused because the hosted Supabase email provider is rate-limited.
- Protected Supabase-backed Admin catalogue/inventory operations are implemented and manually accepted/frozen at the current checkpoint.
- Phone SMS delivery and numeric email OTP delivery are deferred authentication follow-ups. Email is paused and does not block the current admin-data/payment work.

## Phase 5 — Supply Persons & Delivery
**Status: CURRENT — NEXT**
- Admin creates supply persons.
- Admin assigns supply person to order.
- Supply person sees assigned orders only.
- Supply person confirms delivery.
- Admin supply status updates.
- Customer can see appropriate supply information.

## Phase 6 — Customer & Order History
**Status: NOT STARTED**
- Customer records.
- Order history.
- Recent customers.
- Search.
- Supply/payment history.

## Phase 7 — Admin Dashboard & Reports
**Status: NOT STARTED**
- Clean dashboard.
- Dropdown-based navigation.
- Stock reports.
- Sales/order reports.
- Customer reports.
- Supply reports.

## Phase 8 — Security, Testing & Hardening
**Status: NOT STARTED**
- Authorization review.
- Critical workflow tests.
- Audit logging.
- Error handling.
- Backup/recovery verification.
- Performance and security review.

## Phase 9 — Production Deployment
**Status: NOT STARTED**
- Production environment.
- Domain.
- Hosting.
- Database.
- Payment production configuration.
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
Phase 4 payment integration is accepted and frozen. The next implementation phase is Phase 5 — Supply Persons & Delivery.

## Roadmap Rule
Do not jump to a later phase because it appears useful. Record new ideas for later and remain in the current phase until its acceptance criteria are satisfied.

Completed phases are protected. Reopening one requires an explicit change request and impact review.
