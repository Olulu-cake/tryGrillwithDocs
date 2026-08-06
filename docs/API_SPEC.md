# 📜 前後端資料交換與全系統架構規範白皮書 (v2.1)

## 一、 全系統 API 路由與前綴標準 (Global Route Protocol)
1. **核心原則**：`storefront/lib/api-client.ts` 已內建自動補全 `/api` 前綴邏輯。
2. **前端呼叫禁令**：全專案任何頁面或 Context 在呼叫 `apiFetch` 時，**嚴禁傳入帶有 `/api` 開頭的路徑**。
3. **全系統端點對照表 (Endpoint Matrix)**：

| 模組 | 業務功能 | 前端呼叫路徑 | 後端實際註冊路由 | HTTP Method |
| :--- | :--- | :--- | :--- | :--- |
| **購物車** | 取得購物車 | `apiFetch('/cart')` | `GET /api/cart` | GET |
| | 清空購物車 | `apiFetch('/cart')` | `DELETE /api/cart` | DELETE |
| **訂單** | 建立訂單 | `apiFetch('/orders', { method: 'POST', body: ... })` | `POST /api/orders` | POST |
| | 取得訂單詳情 | `apiFetch('/orders/${id}')` | `GET /api/orders/:id` | GET |

---

## 二、 全系統 Identity & ID 動態解析 (v2.1 強制 Header 綁定)
1. **零 Hardcode 政策**：全系統**嚴禁出現任何寫死 ID**（包括 `'cart-123'`, `'user-123'`, `'prod-123'`, `'default-cart-id'`）。
2. **CartId 全雙工自動傳輸規範**：
   - **前端規範 (api-client.ts)**：發送任何 API 時，必須從 LocalStorage 取得或建立動態 `guest_cart_id`，並寫入 Request Header：`'x-cart-id': cartId`。
   - **後端規範 (getCartId)**：解析優先順序：`req.headers['x-cart-id']` > `req.session?.cartId` / `req.cookies?.cartId`。若皆無，才由後端 `crypto.randomUUID()` 降級生成。

---

## 三、 全數據結構規範 (Contracts)
### 訂單建立 Body 結構 (POST /orders)
```json
{
  "buyer": { "name": "張三", "email": "test@example.com", "phone": "0912345678" },
  "receiver": { "name": "張三", "phone": "0912345678", "shippingAddress": "台北市" },
  "items": [{ "productId": "prod-1", "quantity": 2, "price": 500 }],
  "totalAmount": 1000
}
```
