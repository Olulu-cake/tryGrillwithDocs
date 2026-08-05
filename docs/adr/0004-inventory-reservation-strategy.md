# ADR 0004: Stock Reservation on Cart Addition

## Status
Proposed

## Context
In e-commerce, handling inventory concurrency is a critical decision.
- Option A: Only deduct stock during checkout payment. This is simple, but can lead to "overselling" if multiple users pay for the last remaining item simultaneously, causing customer dissatisfaction.
- Option B: Reserve stock when a customer adds an item to their cart. This ensures that if a user has an item in their cart, they are guaranteed to be able to purchase it within a specific time limit. However, it can lead to "cart hoarding" (denial of inventory) where users add items to their carts and never check out.

## Decision
We will implement **Option B: Stock Reservation on Cart Addition with a 15-minute expiration window**.
- When a product is added to a cart, we immediately create a pending stock reservation of `X` quantity.
- The system will reduce the *available* stock by `X`.
- If the customer does not complete checkout within 15 minutes, the reservation expires, the stock is released back to *available*, and the item in the cart is marked as "expired / out of stock" if the customer tries to check out later.
- If they complete checkout, the reservation is permanently converted into a completed stock deduction.

To implement this in our modular monolith:
- We will have a lightweight background job (cron/worker) that runs every minute to clean up expired reservations.
- A single PostgreSQL 18 transaction will handle the cart addition and stock reservation atomic check.

## Consequences
- **Positive**:
  - Prevents overselling completely. Better customer experience during checkout.
  - Cart page can show a live timer ("Reserved for 14:59"), creating a sense of urgency.
- **Negative**:
  - Requires a background worker or cron mechanism to release expired reservations.
  - Vulnerable to stock locking attacks (e.g., malicious scripts adding all items to carts), which must be mitigated at the application firewall/rate-limiting level.
- **Neutral**:
  - Inventory module must expose clear interfaces for reserving, confirming, and releasing stock.
