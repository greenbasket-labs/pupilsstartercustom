# Assessment Book Supply Platform

## Project

A modern web platform for an assessment-book supply business. The first pilot is being developed for a business partner of Green Basket Global Ltd.

The system is designed around the real supply workflow: schools/customers can discover assessment books by class, see availability, place orders without creating an account initially, pay through a verified payment provider, and receive supply updates. The business manages catalogue, inventory, orders, customers, payments, and physical supply from an administration workspace.

## Technology / Development Partner

**Green Basket Global Ltd.**

## Repository

`greenbasket-labs/pupilsstartercustom`

## Current Status

**Phase 4 — Payment Integration — IN PROGRESS**

The Next.js web application foundation is in place. The first Phase 1 administration screen supports adding, editing, saving, activating/deactivating, and removing classes and assessment books with prices without hard-coding the business catalogue into the application.

Catalogue editing has now been manually acceptance-tested locally with the latest Phase 1 code, including reachable Edit and Cancel controls, safe editing of products linked to inactive classes, activation/deactivation, removal rules, and price persistence.

Stable Phase 1 acceptance checkpoint:

`b6ef077 — fix: preserve class access while editing products`

Phase 1 catalogue acceptance is complete. Phase 2 inventory work has been manually accepted, closed, and frozen. Phase 3 customer ordering has been manually accepted, closed, and frozen. Phase 4 payment integration has now started.

Validation at this checkpoint:
- Lint: PASS
- Build: PASS
- Working tree: clean
- Local validation completed after pulling the latest `main`

The current browser-based persistence is a Phase 1 development bridge. The Supabase database will become the production source of truth before real business use.

## Phase 2 Inventory Foundation

The first Phase 2 slice introduces a development inventory ledger tied to saved assessment books:

- Available stock is calculated from traceable stock movements.
- Incoming stock is tracked separately.
- Incoming stock can be received into available stock.
- Stock adjustments are validated so available stock cannot fall below zero.
- Projected stock is calculated from available plus incoming quantities.
- Assessment books with stock history cannot be removed, preserving inventory history.
- Verified customer purchases will later reduce available stock automatically through the order/payment flow and remain linked to payment/order history.
- Checkout or unverified payment must not reduce stock; admin manual reductions are reserved for non-sale reasons and require a recorded reason/note.
- Repeated payment-provider events must not reduce the same order's stock more than once.
- The current browser storage remains a development bridge; Supabase/PostgreSQL will become the production source of truth.

Phase 2 is now closed at its stable acceptance checkpoint.

## Phase 4 Admin Authentication Foundation

The first Admin security slice is now implemented before moving the existing browser-only catalogue/inventory screen into production database writes:

- Admin sign-in uses phone number + OTP through Supabase Auth.
- Authorized admin phone numbers are stored in a server-controlled database table, not hard-coded in source code.
- Authentication tokens are kept in HttpOnly cookies.
- The Admin workspace is protected server-side.
- Future `/api/admin/*` endpoints are protected by the same authorization boundary.
- A development test phone can be added manually, then deactivated/replaced with the client's phone later without changing application code.
- No service-role key is exposed to the browser.

Manual development configuration is intentionally kept outside Git. The current test phone must be added to `public.admin_authorized_phones` in the Supabase project before OTP login can be tested.

## Phase 4 Admin Authentication Options

Admin authentication now supports two server-authorized methods:

- **Phone + OTP** remains available and is not removed. It requires a configured SMS provider before live OTP delivery can be used.
- **Email + OTP** is now available as a second development/testing path through Supabase Email Auth.
- Authorized email addresses are stored in `public.admin_authorized_emails`; they are not hard-coded in the application.
- The existing `public.admin_authorized_phones` authorization table remains in place.
- Both authorization lists are server-controlled, protected by RLS, and checked before an OTP request or authenticated Admin session is accepted.
- Either an active authorized phone identity or an active authorized email identity can enter the Admin workspace.
- No service-role credential is exposed to the browser.
- Phone SMS delivery requires an external SMS provider and is deferred.
- Numeric email OTP delivery is paused because the hosted Supabase email provider is rate-limited.
- Email authentication is not a blocker for the current Phase 4 admin-data/payment work.

The email template/SMTP configuration and numeric OTP acceptance will be resumed later as a dedicated authentication follow-up.

## Phase 4 Admin Data Foundation

The first production Admin data migration is now implemented:

- Classes, assessment books, and stock movements load from Supabase rather than browser localStorage.
- Protected `/api/admin/catalogue` operations use server-side service-role access behind the Admin proxy boundary.
- Catalogue mutations are implemented as server-side database functions.
- Class/product activation and removal rules are enforced in the database.
- Inventory movement validation is enforced in the database, including negative-stock protection, incoming-receipt validation, and required reasons for manual adjustments.
- Inventory changes lock the affected product row before validation and insertion.
- No direct client CRUD policies are added to the exposed catalogue/inventory tables.

Manual browser acceptance of this slice is complete. The Admin Classes/Products/Inventory foundation is accepted and frozen at this checkpoint.

## Phase 4 Payment Integration Foundation

Phase 4 has started with a production-oriented payment data foundation:

- Orders, order items, payments, and payment webhook events have dedicated database tables in the Supabase migration foundation.
- Financial amounts are stored in NGN kobo (minor units).
- Paystack provider references are unique.
- Webhook event idempotency is represented in the database.
- Payment state remains separate from physical supply state.

The next controlled Phase 4 work is to initialize Paystack transactions server-side, verify transactions server-side, validate Paystack webhook signatures, and atomically apply verified-payment stock reduction.

The payment stock boundary has now been acceptance-tested: an unpaid order does not create a purchase movement or change available stock, while consumed paid stock causes a later order that exceeds remaining availability to be rejected. Customer order validation now uses the same purchase-ledger semantics as verified-payment fulfillment. The Supabase-backed Admin Classes/Products/Inventory foundation has already been manually accepted and frozen. Email OTP work remains paused and must not block this sequence.

No Paystack secret or production credential is stored in the repository.

## Phase 3 Customer Ordering Foundation

The first Phase 3 slice introduces a public customer ordering page at `/order`:

- Active assessment books are available for customer selection.
- Available stock is displayed from the existing inventory ledger.
- Customers can select quantities and build a multi-item order.
- School name, contact name, phone number, and optional email are collected.
- Orders receive a customer-facing reference.
- Product/class, price, quantity, and totals are captured on the order record.
- New orders start with Payment: Pending and Supply: Pending Supply.
- A confirmation screen shows the order reference and total.
- Orders persist in the current browser as a temporary development bridge.
- Payment is not processed in Phase 3.
- Creating an order does not reduce stock. Automatic stock reduction remains tied to verified payment in the later payment flow.

Phase 3 browser acceptance, lint/build validation, and documentation are complete. The phase is now frozen at its accepted boundary. The production-oriented Phase 4 ordering slice now reads catalogue, prices, stock, and order creation from Supabase/server APIs.

## Phase 2 Acceptance

Phase 2 inventory was manually acceptance-tested in the development browser and passed:

- Stock received and incoming stock recording.
- Receiving incoming stock into available stock.
- Available, incoming, and projected stock calculations.
- Prevention of receiving more incoming stock than recorded.
- Prevention of negative available stock through stock adjustment validation.
- Preservation of inventory history by blocking product removal after stock history exists.
- Lint and production build validation.

The negative-stock safety test was confirmed by attempting a reduction that would have taken available stock below zero; the application refused to save the movement.

Phase 2 is frozen. The next controlled implementation phase is customer ordering. Automatic stock reduction from verified purchases remains a later order/payment-flow implementation and is not part of this completed browser-only inventory checkpoint.

## Ownership

**Source code ownership remains with Green Basket Global Ltd. unless and until a separate agreed buyout/assignment is completed.**

Client business data, orders, payment records, inventory information, and other customer operational data are separate from source-code ownership and will be handled according to the applicable business agreement.

## Product Direction

The platform will allow schools/customers to:

- Browse assessment books and class-specific products.
- See availability and, where configured, incoming/coming-soon stock.
- Select quantities and see calculated prices.
- Submit an order without being forced to create an account in the initial version.
- Pay through an integrated payment provider.
- Receive payment/order confirmation.
- See supply status and assigned supply contact when applicable.

The administration side will allow the business to:

- Manage products, classes, prices, and stock.
- Record incoming stock.
- View and manage orders.
- Receive automatic payment status updates.
- Assign supply persons.
- Manage supply-person contacts.
- View customer and order history.
- Track physical supply separately from payment.
- Maintain business history and audit records.

Supply persons will have restricted access to orders explicitly assigned by an administrator and may confirm delivery. Their delivery confirmation updates the corresponding supply status for the administrator.

## Admin Workspace Navigation

The administration workspace will use a grouped sidebar rather than placing every feature directly on the page:

```text
PUPILS START
│
├── Overview
│
├── Inventory ▾
│   ├── Stock
│   ├── Incoming Stock
│   └── Stock History
│
├── Orders ▾
│   ├── Orders
│   └── Pending Supply
│
├── Customers ▾
│   ├── Schools
│   └── Customer History
│
├── Products ▾
│   ├── Classes
│   └── Assessment Books
│
├── Payments ▾
│
├── Supply ▾
│   └── Supply Persons
│
└── Reports ▾
```

This navigation structure is the current approved direction. New navigation items should not be added casually; changes should follow the project's controlled-change rules.

## Main Content and School Table Design

School/customer names should **not** be displayed as a large list at the top of the administration pages.

Where school records are shown in a table:

- The **School** name is the first/left column.
- The School column should remain visible while the table is horizontally scrolled.
- Table headings can represent classes/products or other relevant business dimensions.
- The table can scroll vertically when there are many schools.
- The table header should remain visible where appropriate.
- Search/filter controls should be available for large school/customer lists.

This keeps the school identity aligned with its row while allowing the business to work with many classes or product columns.

## Catalogue Management Rule

Classes and assessment books are **business data, not application constants**.

The admin must be able to:

- Add a new class.
- Activate or deactivate a class.
- Remove a class when it has no dependent products.
- Add an assessment book.
- Associate the book with a saved class.
- Set the selling price.
- Activate or deactivate a product.

The application must not require a developer to edit source code whenever the business adds or changes a class or assessment book.

The current Phase 1 development screen persists these entries in the browser. Production persistence will use Supabase/PostgreSQL as defined by the architecture.

## Initial Class Structure

The initial class catalogue is based on the business's supplied class list. These are starting business requirements, not hard-coded UI values:

- KG 1
- KG 2
- Pre-Nursery
- Nursery 1
- Nursery 2
- Nursery 3
- Primary 1
- Primary 2
- Primary 3
- Primary 4
- Primary 5
- Primary 6

The admin remains able to add additional classes without a code change.

## Authentication Direction

The initial administrator login will support **phone number + OTP** because the business owner currently has a phone number as the available login/contact method.

Initial direction:

```text
Admin enters phone number
        ↓
OTP verification
        ↓
Authenticated user
        ↓
Server-side authorization confirms Admin role
        ↓
Admin workspace
```

No admin email/password requirement is being introduced unless the business requirements later change.

Customers/schools will not be forced to create accounts in the initial version.

## Engineering Principle

Build small, build correctly, keep business rules explicit, protect existing functionality, preserve history, test critical workflows, and keep a clean path for future products.

AI-assisted development must follow the project's controlled-change rules: inspect before editing, modify only the approved scope, test the result, update documentation, and create a Git checkpoint after stable work.

## Phase 1 Acceptance

The Phase 1 catalogue workflow was manually tested in the development browser and passed the required acceptance checks:

- Add, edit, activate/deactivate, and remove classes.
- Add assessment books linked to saved classes.
- Edit assessment-book name, class association, and selling price.
- Preserve an existing inactive class association while editing a product.
- Activate/deactivate and remove assessment books.
- Remove a class after its dependent product has been removed.
- Confirm business classes and products are data-driven rather than hard-coded.
- Confirm browser persistence for the current development bridge.

Phase 1 is now closed. Phase 2 is now closed. Phase 3 is now closed. Phase 4 — Payment Integration is now the current controlled implementation phase.

## Project Documentation

- [Roadmap](docs/ROADMAP.md)
- [Project State](docs/PROJECT_STATE.md)
- [Engineering Rules](docs/ENGINEERING_RULES.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Architecture](docs/ARCHITECTURE.md)

## Development Rule

The Git repository and project documentation are the source of truth. Chat conversations are working context only. A new development session must read the project documentation before modifying the codebase.

Important business decisions made during development must be reflected in the appropriate project documentation so the project can continue safely across future sessions.
