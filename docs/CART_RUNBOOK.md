# Cart Module Runbook

## Core Architectural Contracts

### Cart Item DTO (`CartItemDTO`)
```typescript
interface CartItemDTO {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  imageUrl?: string;
}
```

### Cart DTO (`CartDTO`)
```typescript
interface CartDTO {
  items: CartItemDTO[];
  totalQuantity: number;
  totalAmount: number;
}
```

## Defensive Strategies & Configurations

### 1. CORS Credentials
Ensure the backend explicitly allows credentials to maintain session-based cart persistence.
*   **Configuration:** `Access-Control-Allow-Credentials: true`
*   **Warning:** Failure to set this will cause the browser to ignore cookies, resulting in cleared carts on page refresh.

### 2. Async Population
`CartService` must resolve all asynchronous product data lookups (for price, stock, title) using `Promise.all` before finalizing the DTO.
*   **Strategy:** Map item IDs to `Promise<CartItemDTO>` and await resolution to prevent race conditions or partially populated cart objects.

### 3. Inventory Boundary
Backend must enforce strict inventory checks during `POST /api/cart/items`.
*   **Constraint:** If `requestedQuantity > availableStock`, return `400 Bad Request`.
*   **Rationale:** Do not rely solely on frontend validation, as it is susceptible to manipulation.

### 4. Frontend Data Sanitization
Frontend should always treat numeric inputs with strict typing to prevent floating-point errors or injection.
*   **Pattern:** `Number(value || 0).toFixed(2)`
*   **Usage:** Apply when displaying totals or calculating sub-totals derived from API responses.
