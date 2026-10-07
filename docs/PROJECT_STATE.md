# Project State

## Current Phase
**Phase 3 — Customer Ordering**

## Status
**COMPLETE**

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
The first controlled customer-ordering slice was implemented at `/order`:

- Public customer ordering page.
- Active classes/products only.
- Configured available stock displayed from the inventory ledger.
- Product and quantity selection.
- Multi-item order building.
- School name, contact name, phone number, and optional email.
- Customer-facing order reference.
- Order snapshot preserves product name, class, unit price, quantity, line total, and order total.
- Initial payment state is **Pending**.
- Initial supply state is **Pending Supply**.
- Customer confirmation screen shows order reference and total.
- Browser storage is the current temporary development persistence bridge.
- Creating an order does **not** reduce inventory.
- Payment is deliberately excluded from Phase 3.
- Verified-payment stock reduction remains a later payment-flow requirement.

## Phase 3 Acceptance Result
Phase 3 customer ordering was manually accepted in the development browser.

Acceptance completed:
- Customer ordering page loads: **PASS**
- Active assessment book/class shown: **PASS**
- Available stock shown correctly: **PASS**
- Quantity selection and add-to-order: **PASS**
- Multi-item order structure: **PASS**
- Order total calculation: **PASS**
- Required school/contact/phone validation: **PASS**
- Order reference generation: **PASS**
- Payment remains Pending: **PASS**
- Supply remains Pending Supply: **PASS**
- Customer confirmation screen: **PASS**
- Order creation does not reduce stock: **PASS**
- Returning to the order flow works: **PASS**
- Lint: **PASS**
- Production build: **PASS**
- TypeScript/build generation: **PASS**

Browser acceptance example:
- Product: `book`
- Class: `nursery 2`
- Unit price: ₦850
- Quantity: 15
- Order total: ₦12,750
- Order reference: `PS-5004014-951`
- Stock remained at 3,520 after order creation.

The order reference above is a development-browser acceptance example, not production data.

## Stable Phase 3 Checkpoint
Phase 3 acceptance is complete and the phase is now frozen.

The stable implementation checkpoint is the Git commit recorded by this final Phase 3 documentation checkpoint.

## Protected Rules
- Preserve completed Phase 0 documentation unless an explicit change request reopens it.
- Preserve completed Phase 1 catalogue functionality unless an explicit change request reopens it.
- Preserve completed Phase 2 inventory functionality unless an explicit change request reopens it.
- Preserve completed Phase 3 customer-ordering functionality unless an explicit change request reopens it.
- Do not build payment, supply, or later workflows ahead of the roadmap.
- Do not hard-code business classes or products into application pages.

## Next Task
Proceed to Phase 4 — Payment Integration only after this Phase 3 checkpoint is recorded.

Phase 4 scope:
- Payment provider integration.
- Payment verification.
- Webhook handling.
- Idempotency.
- Automatic payment status.
- Payment records.

Automatic stock reduction must be tied to verified payment and must not occur from checkout or unverified payment attempts.

## Last Known Stable State
Phase 3 customer ordering acceptance checkpoint is the latest stable state.

## Handover Rule
Any new AI/developer session must read this file and the other project documentation before changing the repository.
