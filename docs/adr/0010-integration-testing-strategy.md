# ADR 0010: Integration Testing Strategy for Checkout Flow

## Status
Accepted

## Context
We needed a robust way to verify the checkout flow across modules (Orders, Inventory, Payments). Previous testing was limited, creating risks around module interactions and atomic operations.

## Decision
We have implemented high-level integration tests using Vitest.
These tests use a dedicated test database (PostgreSQL 18) with Prisma 7 and the `@prisma/adapter-pg` driver adapter. They verify the full lifecycle of a checkout:
1. Order creation and atomic stock reservation.
2. Payment webhook handling (via Stripe adapter).
3. Strict order state transitions.
4. Fulfillment triggering.

## Consequences
- Requires a configured PostgreSQL 18 test instance.
- Significantly improved confidence in system consistency and atomic operations across the modular monolith.
- Ensures regression testing for critical business flows.
