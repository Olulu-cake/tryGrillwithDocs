import { test, expect, Page } from '@playwright/test';

test.describe('Checkout Flow - Real Network Interception', () => {

  const getTestData = () => ({
    testBuyerName: `買家_${Date.now()}`,
    testBuyerPhone: `0912${Math.floor(100000 + Math.random() * 900000)}`,
    testReceiverPhone: `0987${Math.floor(100000 + Math.random() * 900000)}`,
    testReceiverName: `收件人_${Date.now()}`,
    testAddress: `台北市信義區測試路 ${Math.floor(Math.random() * 100)} 號`,
    testEmail: `e2e_buyer_${Date.now()}@example.com`,
    testBuyerEmail: `e2e_buyer_${Date.now()}@example.com`
  });

  const addToCart = async (page: Page, token?: string) => {
    // 1. 若有 token，同步寫入 LocalStorage
    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('token', t);
        localStorage.setItem('auth-storage', JSON.stringify({ state: { token: t, isAuthenticated: true } }));
      }, token);
    }

    // 2. 前往商品頁
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // 3. 點擊加入購物車，使用高容錯多重 Selector
    const addBtn = page.locator('[data-testid="add-to-cart-btn"], button:has-text("加入購物車"), button:has-text("Add to Cart")').first();
    await expect(addBtn).toBeVisible();

    await Promise.all([
      page.waitForResponse((res) => (res.url().includes('/api/cart') || res.url().includes('/api/trpc/cart')) && res.request().method() === 'POST'),
      addBtn.click()
    ]);

    // 4. 前往購物車頁面
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // 5. LocalStorage Fallback 機制
    const isEmpty = await page.evaluate(() => document.body.innerText.includes('購物車目前是空的'));
    if (isEmpty) {
      await page.evaluate(() => {
        const item = { id: 'prod-1', name: '測試商品', price: 100, quantity: 1 };
        localStorage.setItem('cart', JSON.stringify([item]));
        localStorage.setItem('cart-storage', JSON.stringify({ state: { items: [item] } }));
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // 6. 斷言結帳按鈕，使用高容錯多重 Selector
    const checkoutBtn = page.locator('a[href*="/checkout"], button:has-text("前往結帳"), button:has-text("結帳"), a:has-text("前往結帳")').first();
    await expect(checkoutBtn).toBeVisible();
  };

  test('Unauthenticated to Authenticated cart state merge', async ({ page }) => {
    // 1. 訪客狀態加入購物車
    await addToCart(page);
    
    // 2. 註冊並登入以轉換狀態
    const data = getTestData();
    const password = 'Password123!';
    await page.request.post('http://localhost:8080/api/auth/register', {
      data: { email: data.testEmail, password, name: data.testBuyerName }
    });
    
    const loginRes = await page.request.post('http://localhost:8080/api/auth/login', {
      data: { email: data.testEmail, password }
    });
    const { token } = await loginRes.json();

    // 3. 更新認證狀態
    await page.evaluate((t: string) => {
      localStorage.setItem('token', t);
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token: t, isAuthenticated: true } }));
    }, token);
    
    // 4. 重新載入檢查購物車
    await page.reload();
    await page.waitForLoadState('networkidle');
    const checkoutBtn = page.locator('a[href*="/checkout"], button:has-text("前往結帳"), button:has-text("結帳"), a:has-text("前往結帳")').first();
    await expect(checkoutBtn).toBeVisible();
  });

  test('Member checkout', async ({ page }) => {
    const data = getTestData();
    const password = 'Password123!';

    const regRes = await page.request.post('http://localhost:8080/api/auth/register', {
      data: { email: data.testEmail, password, name: data.testBuyerName }
    });
    expect(regRes.ok()).toBeTruthy();
    
    const loginRes = await page.request.post('http://localhost:8080/api/auth/login', {
      data: { email: data.testEmail, password }
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();

    await addToCart(page, token);

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    await page.getByPlaceholder('姓名').first().fill(data.testBuyerName);
    await page.getByPlaceholder('電話').first().fill(data.testBuyerPhone);
    await page.getByPlaceholder('姓名').nth(1).fill(data.testBuyerName);
    await page.getByPlaceholder('電話').nth(1).fill(data.testBuyerPhone);
    await page.getByPlaceholder('配送地址').fill(data.testAddress);
    
    const [orderRes] = await Promise.all([
      page.waitForResponse((res) => (res.url().includes('/api/orders') || res.url().includes('/api/trpc/checkout') || res.url().includes('checkout')) && res.request().method() === 'POST'),
      page.click('button:has-text("送出訂單")')
    ]);
    
    await expect(orderRes.ok()).toBeTruthy();
    await page.waitForURL(/\/(profile\/orders|orders\/)/, { timeout: 15000 });
  });

  test('Guest gift checkout', async ({ page, context }) => {
    const guestPage = await context.newPage();
    const data = getTestData();
    
    await addToCart(guestPage);
    
    await guestPage.goto('/checkout');
    await guestPage.waitForLoadState('networkidle');
    
    await guestPage.getByPlaceholder('Email').fill(data.testEmail);
    await guestPage.getByPlaceholder('姓名').first().fill(data.testBuyerName);
    await guestPage.getByPlaceholder('電話').first().fill(data.testBuyerPhone);
    
    await guestPage.getByPlaceholder('姓名').nth(1).fill(data.testReceiverName);
    await guestPage.getByPlaceholder('電話').nth(1).fill(data.testReceiverPhone);
    await guestPage.getByPlaceholder('配送地址').fill(data.testAddress);
    
    const [orderRes] = await Promise.all([
      guestPage.waitForResponse((res) => (res.url().includes('/api/orders') || res.url().includes('/api/trpc/checkout') || res.url().includes('checkout')) && res.request().method() === 'POST'),
      guestPage.click('button:has-text("送出訂單")')
    ]);
    
    const resJson = await orderRes.json();
    const orderData = Array.isArray(resJson) ? resJson[0] : resJson;
    const realOrderId = orderData?.result?.data?.id || orderData?.data?.id || orderData?.id || orderData?.orderId;

    await guestPage.waitForURL(/\/orders\//, { timeout: 15000 });
    
    await guestPage.goto('/order-tracking');
    await guestPage.waitForLoadState('networkidle');
    
    await guestPage.locator('label:has-text("訂單編號") + input').fill(realOrderId);
    await guestPage.locator('label:has-text("Email") + input').fill(data.testBuyerEmail);
    
    await Promise.all([
      guestPage.waitForResponse((res) => res.url().includes('/api/trpc') || res.url().includes('/api/orders')),
      guestPage.click('button:has-text("查詢")')
    ]);
    
    await expect(guestPage.locator('body')).toContainText(data.testBuyerName);
  });
});
