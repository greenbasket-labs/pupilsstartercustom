# Assessment Book Supply Platform

## Project

A modern web platform for an assessment-book supply business. The first pilot is being developed for a business partner of Green Basket Global Ltd.

The system is designed around the real supply workflow: schools/customers can discover assessment books by class, see availability, place orders without creating an account initially, pay through a verified payment provider, and receive supply updates. The business manages catalogue, inventory, orders, customers, payments, and physical supply from an administration workspace.

## Technology / Development Partner

**Green Basket Global Ltd.**

## Repository

`greenbasket-labs/pupilsstartercustom`

## Current Status

**Phase 1 — Product, Classes & Pricing — IN PROGRESS**

The Next.js web application foundation is in place. The first Phase 1 administration screen supports adding, editing, saving, activating/deactivating, and removing classes and assessment books with prices without hard-coding the business catalogue into the application.

Catalogue editing has now been validated locally with the latest Phase 1 code, including reachable Edit and Cancel controls and safe editing of products linked to inactive classes.

Current stable checkpoint:

`b6ef077 — fix: preserve class access while editing products`

Validation at this checkpoint:
- Lint: PASS
- Build: PASS
- Working tree: clean
- Local validation completed after pulling the latest `main`

The current browser-based persistence is a Phase 1 development bridge. The Supabase database will become the production source of truth before real business use.

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

## Project Documentation

- [Roadmap](docs/ROADMAP.md)
- [Project State](docs/PROJECT_STATE.md)
- [Engineering Rules](docs/ENGINEERING_RULES.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Architecture](docs/ARCHITECTURE.md)

## Development Rule

The Git repository and project documentation are the source of truth. Chat conversations are working context only. A new development session must read the project documentation before modifying the codebase.

Important business decisions made during development must be reflected in the appropriate project documentation so the project can continue safely across future sessions.
