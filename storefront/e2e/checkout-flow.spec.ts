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

    // 2. 瀏覽商品並加入購物車
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button:has-text("加入購物車"), [data-testid="add-to-cart-btn"]').first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();

    // 3. 留給 Client State 更新的時間，避免硬降級
    await page.waitForTimeout(1000);

    // 4. 前往購物車驗證
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // 5. 斷言結帳按鈕存在或購物車有品項
    const checkoutBtn = page.locator('a[href*="/checkout"], button:has-text("前往結帳"), button:has-text("結帳")').first();
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
  });
});
