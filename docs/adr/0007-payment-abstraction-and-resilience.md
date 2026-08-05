# ADR 0007: Payment Abstraction, API-Integrated Refunds, and Triple-Layer Idempotency

## Status
Accepted

## Context
As the system scales beyond a single payment provider (Stripe), we need a design that:
- Prevents vendor lock-in and allows adding providers like PayPal or Adyen without rewriting core checkout logic.
- Handles operational requirements like refunds and disputes through our internal admin interfaces rather than external dashboards.
- Guarantees financial consistency by preventing double-charges or missed order fulfillments due to network or logic errors.

## Decision
We will implement a resilient and agnostic payment architecture:

1. **Payment Provider Abstraction**:
   - Define a `PaymentGateway` interface that abstracts core operations: `createIntent()`, `executePayment()`, `refund()`, and `handleWebhook()`.
   - Implement vendor-specific adapters (e.g., `StripeAdapter`, `PayPalAdapter`).
   - The checkout module only interacts with the `PaymentGateway` interface.

2. **API-Integrated Refund/Dispute Flow**:
   - Admin APIs will trigger refunds via the `PaymentGateway.refund()` method.
   - Webhook handlers will be expanded to listen for dispute events (e.g., `charge.dispute.created`), automatically marking orders as "Disputed" and notifying staff.

3. **Triple-Layer Idempotency Strategy**:
   - **Database Constraints**: Every `PaymentTransaction` record will have a unique constraint on the pair `(provider_name, provider_transaction_id)`.
   - **Idempotency Keys**: All outgoing calls to provider APIs will include a generated `Idempotency-Key` (e.g., `order_id_attempt_number`) to ensure the provider doesn't process the same intent twice.
   - **State Machine Protection**: The `Order` and `PaymentTransaction` entities will use a strict state machine (e.g., `PENDING` -> `PAID`). Transitioning to `PAID` will be an atomic database operation that fails if the state is already `PAID`.

4. **Transaction Audit Logging**:
   - Every state change and raw webhook payload will be persisted in a `TransactionAuditLog` table for reconciliation.

## Consequences
- **Positive**:
  - High resilience against duplicate processing and network failures.
  - Easier to swap or add payment providers.
  - Centralized management of financial operations (refunds/disputes).
- **Negative**:
  - Increased complexity in the initial implementation of the abstraction layer.
  - Storage overhead for detailed transaction audit logs.
- **Neutral**:
  - Requires maintaining a mapping between internal order IDs and provider-specific transaction IDs.
