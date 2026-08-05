# ADR 0011: Cart and Checkout API Design

## Context
We need to finalize the Cart and Checkout API to manage guest sessions, handle cart merging, enforce stock reservation limits, and integrate securely with our Stripe webhook-based checkout flow.

## Proposed Approach
1. **Cart Identity**: Cart linked to `SessionID` or `UserID`.
2. **Merging**: On user login, sum item quantities. Ensure inventory reservation is updated accordingly.
3. **Checkout Initiation**:
    - Validate cart integrity and re-verify stock availability.
    - Extend reservation TTL (idempotent operation).
    - Create Stripe Checkout Session.
    - Transition order state to `PENDING_PAYMENT`.
4. **Timeout Handling**: Leverage the background worker to release stock reservations if `PENDING_PAYMENT` order isn't completed within the extended time limit.

## Decisions Made
- **Merging**: Sum quantities on collision.
- **Checkout Initiation**: Always re-verify stock and extend reservation TTL (idempotent).
- **Timeouts**: Handle edge cases like Stripe delays by ensuring the extension logic is robust and idempotent.
