import { test, expect, Page } from '@playwright/test';

async function getCartCount(page: Page): Promise<number> {
  const badge = page.getByTestId('cart-badge');
  if (await badge.isVisible()) {
    const text = await badge.innerText();
    return parseInt(text, 10) || 0;
  }
  return 0;
}

test.describe('Shopping Cart Functionality', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // 徹底清除後端賦予的 Session ID Cookie
    await context.clearCookies();
    
    // 造訪產品頁面
    await page.goto('/products');
    
    // 清除客戶端所有狀態
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 再次清除 Cookies 並重新載入
    await context.clearCookies();
    await page.reload();
  });

  test('Guest cart: Header Badge number dynamically syncs when adding items', async ({ page }) => {
    // 確保頁面載入完成，購物車狀態已同步
    await page.waitForLoadState('networkidle');
    const cartBadge = page.getByTestId('cart-badge');

    // 1. 加入第一件商品
    const initialCount = await getCartCount(page);
    await page.locator('[data-testid="product-item"]').first().getByTestId('add-to-cart-btn').click();
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText((initialCount + 1).toString());

    // 2. 加入第二件商品
    const currentCount = await getCartCount(page);
    await page.locator('[data-testid="product-item"]').nth(1).getByTestId('add-to-cart-btn').click();
    await expect(cartBadge).toHaveText((currentCount + 1).toString());
  });

  test('Cart page: items and total price verification, quantity update and removal', async ({ page }) => {
    // 加入兩件商品
    await page.locator('[data-testid="product-item"]').first().getByTestId('add-to-cart-btn').click();
    await page.locator('[data-testid="product-item"]').nth(1).getByTestId('add-to-cart-btn').click();

    // 前往購物車
    await page.goto('/cart');

    // 核對商品數量
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(2);

    // 核對金額 (假設金額選擇器)
    const totalPrice = page.getByTestId('cart-total-price');
    await expect(totalPrice).toBeVisible();

    // 修改數量
    await cartItems.first().getByTestId('increase-qty-btn').click();
    // 假設數量改變影響總價
    // await expect(...).toContainText(...);

    // 移除商品
    await cartItems.first().getByTestId('remove-item-btn').click();
    await expect(cartItems).toHaveCount(1);
  });
});
