# Domain Glossary: E-Commerce System

This document defines the key domain terms, bounded contexts, and concepts used within our E-commerce system. It will be updated iteratively as our design is grilled and refined.

## Core Entities & Concepts

### 1. Product
* **Definition**: An item or service available for sale in the catalog.
* **Attributes**: ID, Name, Description, Price, SKU (Stock Keeping Unit), Category, Images.
* **Bounded Context**: Catalog / Product Management.

### 2. Inventory
* **Definition**: The physical or virtual stock level of products across warehouses.
* **Attributes**: SKU, Quantity Available, Quantity Reserved, Warehouse ID.
* **Bounded Context**: Inventory Management.

### 3. Cart (Shopping Cart)
* **Definition**: A temporary virtual container holding items selected by a customer prior to checkout.
* **Attributes**: Cart ID, Customer ID (optional/guest), Line Items, Total Price, Expiration Timestamp.
* **Bounded Context**: Shopping Cart / Checkout.

### 4. Order
* **Definition**: A finalized, legally binding purchase contract between the customer and the business, created upon successful checkout.
* **Attributes**: Order ID, Customer ID, Line Items (Snapshot of Products with purchased price), Shipping Address, Billing Address, Payment Status, Fulfillment Status, Total Amount, Created Timestamp.
* **Bounded Context**: Order Management.

### 5. Customer / User
* **Definition**: An entity (guest or registered) that browses products, manages a cart, and places orders.
* **Attributes**: User ID, Email, Name, Saved Addresses, Payment Methods.
* **Bounded Context**: Identity & Access Management / Customer Profiles.

### 6. Stock Reservation
* **Definition**: A temporary lock placed on a product's inventory when added to a customer's shopping cart. It guarantees item availability for a set duration (e.g., 15 minutes) before being released back to the general stock if checkout isn't completed.
* **Bounded Context**: Inventory Management / Shopping Cart.

### 7. Modular Monolith
* **Definition**: An architectural pattern where the entire system is built and deployed as a single application process, but internally composed of strictly isolated, independent modules with well-defined interfaces.
* **Bounded Context**: System Architecture.

### 8. Idempotent Webhook Handler
* **Definition**: A web endpoint designed to process inbound webhook events (such as Stripe payments) exactly once, even if the event is delivered multiple times by the provider due to network retries.
* **Bounded Context**: Payment / Integration.

### 9. Shadow User / Guest Account
* **Definition**: A placeholder user profile created automatically during a guest checkout transaction to hold the order's customer data without requiring a password or formal registration.
* **Bounded Context**: Identity & Access Management.

### 10. Payment Provider Interface
* **Definition**: An internal abstraction layer (typically a set of interfaces or traits) that standardizes how the system interacts with different payment processors (e.g., Stripe, PayPal, Adyen). It ensures the core business logic remains decoupled from vendor-specific SDKs.
* **Bounded Context**: Payment / Integration.

### 11. Transaction Audit Log
* **Definition**: A read-only ledger that records every interaction with payment providers, including intent creation, webhook payloads, API response codes, and status transitions. Essential for financial reconciliation and debugging.
* **Bounded Context**: Payment / Finance.

---
*Last Updated: 2026-07-24*
