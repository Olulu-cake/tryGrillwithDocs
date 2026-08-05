# ADR 0009: Modular Database Schema Definition

## Status
Proposed

## Context
We require a structured database schema that enforces strict modular boundaries, supports our guest checkout flow (shadow accounts), inventory reservation, payment idempotency, and future fulfillment scalability.

## Decision
We will adopt a modular schema structure where modules reference entities via logical identifiers rather than database-level joins.

### Entity Definitions

#### 1. Users Module
*   `User`: (ID, Email, Role, IsRegistered)
*   `Address`: (ID, UserID, Type [shipping/billing])
*   *Lifecycle*: Abandoned guest shadow accounts (isRegistered: false) will be pruned after 24 hours via a background job (BullMQ).

#### 2. Inventory Module
*   `Product`: (ID, SKU, Price)
*   `InventoryItem`: (ID, ProductID, AvailableStock, ReservedStock)
*   `StockReservation`: (ID, ProductID, CartID, ExpirationTime)

#### 3. Orders Module
*   `Order`: (ID, UserID, Status, PaymentStatus, FulfillmentStatus, TotalAmount)
*   `OrderItem`: (ID, OrderID, ProductID, Quantity, PriceAtPurchase)

#### 4. Payments Module
*   `PaymentTransaction`: (ID, OrderID, Provider, ProviderID, Status, Amount, IdempotencyKey)
*   `TransactionAuditLog`: (ID, TransactionID, RawPayload)

#### 5. Fulfillment Module
*   `Shipment`: (ID, OrderID, Carrier, Status, TrackingNumber, LabelURL)

## Consequences
- **Strict Boundary Enforcement**: Modules only interact via logical IDs, facilitating future migration to independent microservices.
- **Maintainability**: Clear separation of concern reduces cross-module coupling.
- **Performance**: Logical references allow for easier partitioning of the database if required later.
