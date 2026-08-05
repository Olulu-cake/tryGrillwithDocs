# Project Context: E-Commerce Modular Monolith

This file serves as the definitive architectural reference for the system.

## 1. Database Architecture & Selection
- **Database**: Neon PostgreSQL 18.
- **ORM/Driver**: Prisma 7 with `@prisma/adapter-pg` driver adapter for optimized, direct database communication.
- **Data Precision**: All monetary values (e.g., `priceAtPurchase`, `totalAmount`) utilize the SQL `Decimal(10, 2)` type to ensure precise financial calculations and avoid floating-point errors.

## 2. Core Data Models (Bounded Contexts)
| Model | Module | Responsibility |
| :--- | :--- | :--- |
| `User` | Users | Identity and profile management. |
| `Product` | Catalog | Core product definitions and metadata. |
| `StockReservation` | Inventory | Tracks pending and committed stock locks. |
| `Order` | Orders | Lifecycle management of customer orders. |
| `PaymentTransaction` | Payments | Recording of payment attempts and results. |
| `ProcessedWebhook` | Shared/Payments | Idempotency guard for external webhooks. |
| `Shipment` | Fulfillment | Tracking information and shipping status. |
| `Coupon` | Promotions | Discount and promotion code management. |

## 3. Inventory Protection Mechanism
To prevent overselling, we implement **Optimistic Locking** at the database level:
- **Mechanism**: All stock deductions use an atomic `updateMany` operation.
- **Query Structure**:
  ```prisma
  await tx.product.updateMany({
    where: {
      id: productId,
      availableStock: { gte: quantity } // Atomic check
    },
    data: { availableStock: { decrement: quantity } }
  });
  ```
- **Validation**: This mechanism is verified by `inventory.service.spec.ts` and `checkout.integration.spec.ts` against a live PostgreSQL 18 instance.

## 4. E-Commerce Flow Enhancements
### Stripe Webhook Idempotency
- **Mechanism**: Wrapped in a Prisma `$transaction` to ensure the idempotency check in `ProcessedWebhook` and order state update are atomic.
- **Implementation**: `src/modules/payments/webhooks/stripe.webhook.handler.ts`

### Promotions Engine
- **Service**: `PromotionService` validates coupons (expiry, usage limits, minimum order amount) and manages usage count.
- **Logic**: Used during checkout calculation.

### Order State Machine
- **Service**: `OrderStateService` enforces strict state transitions (`PENDING` -> `PAID` -> `SHIPPED` -> `COMPLETED` or `CANCELLED`).
- **Safety**: Prevents invalid transitions and handles post-cancellation logic.

## 5. Fulfillment Architecture
- **ShippingProvider Interface**: Includes `getTrackingInfo` method to retrieve live tracking status from carriers.
- **LabelGenerationService**: Orchestrates label creation; handles retries with exponential backoff on transient failures.
- **ReconciliationService**: Performs periodic reconciliation between carrier webhook events and system order states, ensuring consistency via status polling.

## 6. Cart & Checkout API (`initiateCheckout`)
The `initiateCheckout` function in `src/checkout.controller.ts` is the entry point for starting the order process.

### Architecture
- **Atomicity**: Wrapped in a Prisma `$transaction` to ensure all steps succeed or fail together.

### Logic Flow
1. **Cart Merging**: Guest cart reservations are merged into the user's cart. If a product already exists in the user's cart, the quantities are summed.
2. **Reservation Extension**: Iterates through all reservations for the user cart and calls `InventoryService.extendReservation`.
   - **TTL Behavior**: Extensions are idempotent. If a reservation is already extended (based on `createdAt` threshold), the operation is a no-op. Otherwise, the TTL is extended to 30 minutes from `createdAt`.
3. **Order Creation**: Creates a new order in `PENDING` status.
4. **Promotion/Discount Application**: Validates and applies coupons if provided.

## 7. Development & Testing Commands
### Integration Tests
To verify the system functionality against the live PostgreSQL database:
- **Cart/Checkout Flow**: `npx vitest run src/tests/checkout-endpoint.integration.spec.ts`
- **Reservation Extension**: `npx vitest run src/tests/reservation-extension.integration.spec.ts`
- **Full Checkout Flow**: `npx vitest run src/tests/checkout.integration.spec.ts`

## 8. Environment Configuration
- **Configuration**: Managed via `.env` file.
- **Connection**: `DATABASE_URL` uses the format `postgresql://<user>:<password>@<host>/<db>?sslmode=require`.
- **Strategy**: The system dynamically handles connections through the Prisma 7 driver adapter. Ensure the `DATABASE_URL` is configured for your specific Neon branch/endpoint. **Never commit the `.env` file to source control.**
