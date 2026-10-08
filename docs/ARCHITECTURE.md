# Architecture

## Confirmed Initial Stack

- Web application: **Next.js + TypeScript**
- Database/authentication: **Supabase/PostgreSQL**
- Payments: **Paystack**
- Hosting: **Vercel**
- Transactional email: **Resend**
- Source control: **GitHub**

The stack is intentionally simple for Version 1. It can scale without introducing unnecessary infrastructure.

## Application Shape
Prefer a modular monolith with clear domain boundaries.

Initial application areas:
- Public customer experience
- Admin workspace
- Supply-person workspace
- Shared business/domain logic

## Core Domains
Keep these concepts separate:
- Users and roles
- Customers/schools
- Products
- Classes/categories
- Inventory
- Stock movements
- Orders
- Order items
- Payments
- Supply assignments
- Supply persons
- Delivery records
- Audit logs

## Inventory Model

Inventory is represented through traceable stock movements rather than an overwrite-only stock quantity.

The development Phase 2 foundation distinguishes:

- Available stock.
- Incoming stock.
- Projected stock (available + incoming).
- Stock movement history.

Movement types currently used by the system include:

- Stock Received: increases available stock.
- Incoming Stock: increases incoming stock.
- Receive Incoming: moves recorded incoming stock into available stock.
- Stock Adjustment: applies a signed adjustment to available stock.
- Purchase: reduces available stock for a verified paid order.

Purchase movements are linked to the corresponding order/payment history and must be idempotent so repeated payment-provider events cannot reduce stock twice.

Inventory validation must prevent available or incoming stock from becoming negative through an invalid movement. Product removal is blocked once inventory history exists so stock history is preserved.

## State Separation
Payment state and supply state are independent.

Payment:
`Pending → Paid / Failed / Refunded`

Supply:
`Pending → Assigned → Supplied`

## Data Integrity
The database is the source of truth for prices, stock, orders, payment state, supply assignments, and permissions. The browser must not be trusted to determine financial or inventory truth.

## Critical Transactions
Payment confirmation, order creation, and inventory changes must be designed so partial failures do not leave inconsistent business state.

## Roles

### Admin
Full operational control.

### Customer
Public ordering and access to applicable order information.

### Supply Person
Restricted access to assigned orders and delivery confirmation.

## UI Principle
Keep the interface clean and modern. Admin functionality should use grouped/dropdown navigation rather than scattering every function across the main dashboard.

## Architecture Rule
Do not introduce microservices or unnecessary infrastructure for Version 1. New infrastructure requires a concrete business or technical reason and explicit approval.
