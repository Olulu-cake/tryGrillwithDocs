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

    // 5. 前往購物車
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // 6. 驗證結帳按鈕可見
    const checkoutBtn = page.locator('a[href*="/checkout"], button:has-text("前往結帳"), button:has-text("結帳")').first();
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
  });
});
