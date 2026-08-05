# ADR 0005: Asynchronous Webhook-Based Payment Flow with Stripe

## Status
Proposed

## Context
When integrating with payment processors like Stripe, relying solely on synchronous HTTP client redirects (frontend-driven) is unreliable:
- The customer might close the browser or lose connection after payment completes but before redirecting back to our success page.
- This creates "orphaned payments," where the customer's card is charged, but our database never records the successful order or triggers fulfillment.

## Decision
We will use **Stripe Checkout with Asynchronous Webhook verification**.
1. **Initiate**: When a customer clicks "Checkout," the server communicates with Stripe to create a *Stripe Checkout Session* containing the reserved items.
2. **Redirect**: The client is redirected to Stripe's hosted payment page.
3. **Completion**: Stripe handles card validation, 3D Secure, etc.
4. **Notification**: Once payment is successful, Stripe securely sends a POST request (`checkout.session.completed` event) to our backend webhook endpoint.
5. **Fulfillment**: Our webhook handler validates the signature, marks the order as *Paid*, converts the stock *Reservation* to *Deducted*, and initiates fulfillment (e.g., email confirmation).

## Consequences
- **Positive**:
  - Resilient to network disruptions, browser crashes, or missed redirects.
  - Offloads PCI-compliance and card handling entirely to Stripe.
  - Standardized, high-conversion payment interface out-of-the-box.
- **Negative**:
  - Requires exposing a public endpoint for Stripe webhooks (requires local tunneling tools like Stripe CLI during development).
  - Webhook delivery is at-least-once, so our webhook controller must be **idempotent** (checking if the order is already marked as Paid before processing).
- **Neutral**:
  - The payment state must transition from `Pending` -> `Paid` or `Failed` asynchronously. The frontend should poll our server or use Server-Sent Events (SSE) to update the user when the webhook completes.
