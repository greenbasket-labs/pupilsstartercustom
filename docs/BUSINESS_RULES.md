# Business Rules

## Parties
- Technology/development partner: **Green Basket Global Ltd.**
- Client/business partner: identified in the applicable MOU/contract.

## Intellectual Property
**Source code ownership remains with Green Basket Global Ltd. unless and until a separate agreed buyout/assignment is completed.**

Any buyout or assignment must be governed by a separate written agreement or the applicable MOU/contract.

Green Basket Global Ltd.'s reusable technology, general libraries, engineering methods, pre-existing intellectual property, and technology developed independently for other customers remain protected unless a written agreement expressly states otherwise.

## Customer Access
The initial customer experience does not require a customer account.

A customer can browse products, see configured availability, select products and quantities, enter basic school/contact information, place an order, pay online, receive an order reference, and see applicable payment and supply status.

## Product and Pricing
Products may be associated with classes/categories. The administrator controls product pricing. Prices must not be hard-coded.

## Stock
The system distinguishes available stock and incoming stock. Projected stock may be shown where appropriate. Stock movements must be traceable.

## Payment
Payment status is automatic and must come from verified payment-provider events. The administrator does not manually mark an order as paid. Payment status is separate from physical supply status.

## Supply
The administrator creates supply-person records and assigns supply persons to orders. A supply person cannot assign orders to themselves. A supply person sees only assigned orders and can confirm physical delivery.

## Supply Contact
When appropriate, the assigned supply person's name and phone number may be shown to the customer. Supply-person information is associated with the specific order so historical records remain accurate.

## Order Status
Payment and supply are independent.
- Payment: **Paid**
- Supply: **Pending Supply**
- Later: **Supplied**

## Customer History
Orders automatically become part of business history. The administrator can search customers and view recent/customer order history.

## Customer Data
Customer business data belongs to the client/business according to the applicable agreement. Source-code ownership is separate from data ownership.

## Scope Rule
This product is an independent assessment-book supply application. Other businesses or the client's own school will be separate products unless a future written decision explicitly changes this boundary.
## Inventory and Verified Purchases
Stock is controlled through a traceable movement ledger.

- Admin may add available stock through stock-received movements.
- Admin may record incoming stock and receive it into available stock.
- A verified customer purchase will automatically reduce available stock as part of the order/payment flow.
- An unverified payment or checkout attempt must not reduce stock.
- The automatic purchase reduction must be linked to the corresponding order/payment history.
- Repeated payment-provider events must not reduce the same order's stock more than once.
- Admin may manually reduce stock for non-sale reasons such as damage, loss, internal use, or physical-count correction.
- Manual stock reductions require a reason/note and remain part of the inventory history.
