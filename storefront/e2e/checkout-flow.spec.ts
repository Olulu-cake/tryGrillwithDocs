import { test, expect } from '@playwright/test';

test.describe('Checkout Flow - Final Resilient Suite', () => {
  test('Member checkout flow', async ({ page }) => {
    // 1. 會員註冊與登入
    const email = `test_${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');

    // 2. 瀏覽商品列表
    await page.goto('/products');
    
    // 3. 加入購物車
    await page.locator('[data-testid="product-item"]').first().getByTestId('add-to-cart-btn').click();

    // 4. 前往購物車
    await page.goto('/cart');

    // 5. 前往結帳
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // 6. 填寫結帳資料
    await page.getByTestId('checkout-buyer-name').fill('Test User');
    await page.getByTestId('checkout-buyer-email').fill(email);
    await page.getByTestId('checkout-buyer-phone').fill('0912345678');
    await page.getByTestId('checkout-shipping-name').fill('Test User');
    await page.getByTestId('checkout-shipping-phone').fill('0912345678');
    await page.getByTestId('checkout-shipping-address').fill('台北市大安區測試路1號');
    
    // 7. 提交訂單
    await page.getByTestId('submit-order-btn').click();

    // 8. 結帳成功頁驗證
    await expect(page).toHaveURL(/\/checkout\/success\?orderId=/);
  });
});
