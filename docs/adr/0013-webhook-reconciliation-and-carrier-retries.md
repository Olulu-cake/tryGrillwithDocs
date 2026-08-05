# ADR 0013: Webhook Reconciliation and Carrier Retries

## Status
Accepted

## Context
Our fulfillment module relies on external carrier webhooks to update shipment statuses. These webhooks are inherently unreliable due to network issues, carrier downtime, or race conditions. When a webhook fails or is lost, the order state becomes desynchronized from the actual carrier shipment status, leading to poor customer experience and operational overhead. We need a robust mechanism to guarantee consistency.

## Decision
We have decided to implement a two-pronged approach for ensuring shipment status consistency:
1. **Exponential Backoff Retries for Label Generation**: The `LabelGenerationService` will now include an exponential backoff retry mechanism when interacting with the shipping provider. This handles transient network issues during the initial label creation phase.
2. **Active Status Polling Reconciliation**: The `ReconciliationService` will periodically poll the shipping provider using the new `ShippingProvider.getTrackingInfo()` interface to reconcile order states. This ensures that even if webhooks fail or are missed, the system will eventually self-correct to the actual carrier status.

## Consequences
- **Positive**: High degree of consistency between our system and carrier status. Improved reliability of label generation.
- **Negative**: Increased load on shipping provider APIs due to polling (will be mitigated by long polling intervals and intelligent filtering of "terminal" order states).
- **Neutral**: Requires careful configuration of retry parameters and polling frequency.
