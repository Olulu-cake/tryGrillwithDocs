# ADR 0012: Robust Webhook Idempotency & Order State Machine

Status: Accepted

## Context
Our e-commerce platform relies on external payment providers (Stripe) and needs to ensure reliable state transitions for orders while handling potential network retries or duplicate webhook events.

## Decision
1. **Webhook Idempotency**: All webhook handlers must implement an atomic idempotency check using the `ProcessedWebhook` table within a database transaction.
2. **Order State Machine**: Transitions between order states (`PENDING`, `PAID`, `SHIPPED`, `COMPLETED`, `CANCELLED`) must be managed via an `OrderStateService` to enforce rules, preventing invalid state changes and ensuring dependent actions (e.g., inventory release on cancellation) are executed.

## Consequences
- **Positive**: Increased reliability, prevention of duplicate payments/shipments, and consistent order state lifecycle.
- **Negative**: Slightly higher complexity in webhook handlers due to transaction management.
