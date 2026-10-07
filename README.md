# Assessment Book Supply Platform

## Project

A modern web platform for an assessment-book supply business. The first pilot is being developed for a business partner of Green Basket Global Ltd.

## Technology / Development Partner

**Green Basket Global Ltd.**

## Repository

`greenbasket-labs/pupilsstartercustom`

## Current Status

**Phase 0 — Foundation & Engineering Rules**

No application features have been implemented yet. This repository is intentionally starting with the project constitution, roadmap, business rules, and architecture direction before application code.

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

## Engineering Principle

Build small, build correctly, keep business rules explicit, protect existing functionality, preserve history, test critical workflows, and keep a clean path for future products.

## Project Documentation

- [Roadmap](docs/ROADMAP.md)
- [Project State](docs/PROJECT_STATE.md)
- [Engineering Rules](docs/ENGINEERING_RULES.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Architecture](docs/ARCHITECTURE.md)

## Development Rule

The Git repository and project documentation are the source of truth. Chat conversations are working context only. A new development session must read the project documentation before modifying the codebase.
