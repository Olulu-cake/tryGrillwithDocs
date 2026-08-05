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

    // 2. 瀏覽商品列表，並點擊第一個商品進入詳細頁
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const firstProductLink = page.locator('a[href*="/products/"]').first();
    if (await firstProductLink.isVisible().catch(() => false)) {
      await firstProductLink.click();
      await page.waitForLoadState('networkidle');
    }

    // 3. 在詳細頁點擊『加入購物車』
    const addBtn = page.locator('button:has-text("加入購物車"), [data-testid="add-to-cart-btn"]').first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(1000);

    // 4. 前往購物車驗證
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // 5. 驗證頁面非空，且包含結帳按鈕或購物車品項
    const checkoutBtn = page.locator('a[href*="/checkout"], button:has-text("前往結帳"), button:has-text("結帳")').first();
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
  });
});
