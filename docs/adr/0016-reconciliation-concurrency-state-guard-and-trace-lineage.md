# ADR 0016: Reconciliation Concurrency, State Guard, and Trace Lineage

## Status
Proposed

## Context
As defined in ADR 0013, our `ReconciliationService` performs active status polling to ensure consistency with carrier shipment states. This introduces two critical technical challenges:
1. **Concurrency/Race Conditions**: Overlap between reactive webhooks and periodic polling must not corrupt the order state.
2. **Traceability**: Reconciliation tasks that fix state mismatches must be linked to the original order's lifecycle, rather than appearing as isolated system tasks, to maintain end-to-end observability.

## Decision

### 1. Concurrency & State Machine
Both reactive webhooks and active reconciliation polling must pass through a single, idempotent `OrderStateService`.
- **Concurrency Control**: Use optimistic concurrency control (version column) on the order/shipment record.
- **State Guard**: Implement strict state machine transition rules (e.g., `SHIPPED` -> `DELIVERED` is valid, but `DELIVERED` -> `SHIPPED` is not). Concurrent attempts that arrive second will fail validation or result in a NOOP without corrupting state.

### 2. Optimistic Lock Contention Handling
On `OptimisticLockException` during reconciliation, the service will:
1. **Immediate Re-read**: Perform one immediate re-read of the record to check the current DB state.
2. **Verification**: 
   - If the DB state already matches the target state (e.g., already `DELIVERED`), log a graceful NOOP.
   - If the DB state is still stale (indicating the concurrent webhook failed or reverted), retry the update transaction immediately.

### 3. OTel Span Linking
To maintain trace lineage without polluting the span hierarchy, we will use OpenTelemetry Span Links.
- When the reconciliation job creates a span to fix an order state, it extracts the original order's OTel `spanContext`.
- Attach this context to the reconciliation span via OpenTelemetry's native Link API: `[{ context: parentSpanContext }]`.
- This ensures native distributed trace stitching in OTel-compliant backends (e.g., Jaeger, Honeycomb) while maintaining the cron job's own execution trace.

## Consequences
- **Positive**:
  - Robust handling of race conditions between webhooks and polling.
  - Native, accurate trace stitching for reconciliation actions.
  - Consistent and predictable order state management.
- **Negative**:
  - Requires implementation of OTel span linking logic.
  - Increased complexity in the `OrderStateService` transaction handling.
- **Neutral**:
  - Slight performance overhead during contention, offset by immediate retries rather than waiting for next cycle.
