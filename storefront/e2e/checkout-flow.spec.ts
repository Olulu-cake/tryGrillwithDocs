import { test, expect } from '@playwright/test';

test.describe('Checkout Flow - Final Resilient Suite', () => {

  const ensureAuthenticatedAndAddToCart = async (page: any) => {
    // 1. 先進行快速註冊/登入以確保取得合法身份 Session
    const email = `test_${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');

    // 2. 前往商品頁面
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // 3. 點擊商品並加入購物車，同時監聽 API 響應
    // 使用優先順序選擇器，並確保按鈕可見
    const addBtn = page.locator('[data-testid="add-to-cart-btn"]').first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });

    const [response] = await Promise.all([
      // 監聽購物車/trpc API 請求
      page.waitForResponse(
        (r: any) => (r.url().includes('/cart') || r.url().includes('/trpc')) && r.status() < 400,
        { timeout: 10000 }
      ),
      addBtn.click()
    ]);

    expect(response.status()).toBeLessThan(400);

    // 4. 前往購物車頁面
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // 驗證畫面確實有商品，並且有結帳按鈕
    const checkoutBtn = page.locator('a[href*="/checkout"], button:has-text("前往結帳"), button:has-text("結帳")').first();
    await expect(checkoutBtn).toBeVisible();
  };

  test('Member checkout flow', async ({ page }) => {
    await ensureAuthenticatedAndAddToCart(page);
    
    // 續行後續結帳測試步驟
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // 假設表單元件的 testid (參考 user-journey.spec.ts)
    await page.getByTestId('checkout-buyer-name').fill('Test Member');
    await page.getByTestId('checkout-buyer-email').fill(`member_${Date.now()}@example.com`);
    await page.getByTestId('checkout-buyer-phone').fill('0912345678');
    await page.getByTestId('checkout-shipping-name').fill('Test Member');
    await page.getByTestId('checkout-shipping-phone').fill('0912345678');
    await page.getByTestId('checkout-shipping-address').fill('台北市測試區測試路1號');
    
    await page.getByTestId('submit-order-btn').click();
    
    await expect(page).toHaveURL(/\/checkout\/success/);
  });
});
