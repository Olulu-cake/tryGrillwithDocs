# ADR 0008: Order Fulfillment & Shipping Strategy

## Status
Accepted

## Context
We need a robust, pluggable system for shipping and fulfillment that decouples core business logic from third-party carrier SDKs.

## Decision
1. **Pluggable Carrier Architecture:** Implement a `ShippingProvider` interface using generic I/O DTOs (e.g., `CreateLabelInput`, `LabelGenerationResult`).
2. **Vendor-Specific Adapters:** Concrete adapters (e.g., `FedExAdapter`) handle translation between generic DTOs and vendor-specific payloads. Opaque `metadata` fields in inputs allow for vendor-specific configuration without interface pollution.
3. **Webhook Handling:** A unified `/api/webhooks/shipping/:carrier` endpoint uses a `CarrierWebhookAdapter` to verify, parse, and normalize vendor webhooks into internal `ShipmentTrackingUpdatedEvent` system events, ensuring core business logic remains carrier-agnostic.
4. **Partial Fulfillment:** Database schema supports 1:N (Order to Shipments), though MVP restricts this to 1:1.
5. **Shipping Calculations:** Strategy Pattern for internal rate engines, supporting tiered weight-based calculations with versioned tables to ensure stability.

## Consequences
- High maintainability and extensibility for new carriers.
- Clean separation between core business logic and infrastructure concerns.
- Resilient tracking updates via normalized system events.
