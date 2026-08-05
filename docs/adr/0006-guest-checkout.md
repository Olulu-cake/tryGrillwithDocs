# ADR 0006: Guest Checkout Support with Automatic Shadow User Creation

## Status
Proposed

## Context
Forcing shoppers to register before purchasing introduces friction and decreases checkout conversion rates. We need to allow shoppers to complete orders as guests while keeping our database schema cohesive and ready for post-checkout user onboarding (e.g., "Create an account to track this order").

## Decision
We will **allow Guest Checkout** by introducing an anonymous/guest user state:
1. When a guest starts checkout, they provide an Email, Shipping Address, and Billing Address.
2. The system checks if a user account with that email already exists:
   - If it **does not exist**, the system automatically creates a "shadow" user account with a `role: 'guest'` or `is_registered: false` flag and a null/random password.
   - If it **does exist**, we can allow the guest order to attach to that existing user ID (noting that they will not have access to saved cards or addresses unless they log in, to preserve security).
3. The order is fully processed and linked to this user ID.
4. After payment completion, we show an option on the Order Confirmation page: "Create a password to track your order and save your details for next time." If they do, we update `is_registered: true` and set their password, transitioning them to a full customer account.

## Consequences
- **Positive**:
  - Maximum checkout conversion (lowest friction).
  - Keeps our core Database Schema clean: every Order always belongs to a `user_id` record, avoiding nullable foreign keys or separate `guest_orders` tables.
  - Smooth user upgrade path post-purchase.
- **Negative**:
  - Security care must be taken: we must ensure that someone cannot simply query another user's order history by guess-typing their email. Orders placed as guests must have a unique, unguessable secure token (e.g., UUID/slug) in the URL to view details, or require login.
- **Neutral**:
  - Customer profile domain must handle the differentiation between registered and guest users.
