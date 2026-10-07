# Assessment Book Supply Platform

## Project

A modern web platform for an assessment-book supply business. The first pilot is being developed for a business partner of Green Basket Global Ltd.

The system is designed around the real supply workflow: schools/customers can discover assessment books by class, see availability, place orders without creating an account initially, pay through a verified payment provider, and receive supply updates. The business manages catalogue, inventory, orders, customers, payments, and physical supply from an administration workspace.

## Technology / Development Partner

**Green Basket Global Ltd.**

## Repository

`greenbasket-labs/pupilsstartercustom`

## Current Status

**Phase 1 — Web Application Foundation and Catalogue Design**

The project foundation and engineering rules are complete. The Next.js web application foundation has been created under `apps/web`, dependencies installed, lint/build checks passed, and the foundation was committed as:

`1d67263 — chore: initialize Next.js web application`

The working application is intentionally still at the framework foundation stage. Business features are being added in controlled Phase 1 steps.

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

## Initial Class Structure

The initial class catalogue is based on the business's supplied class list:

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

Classes should be managed as data rather than hard-coded into individual pages.

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
