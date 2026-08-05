import { test, expect } from '@playwright/test';

test.describe('Checkout Flow - Final Resilient Assertion', () => {

  const getTestData = () => ({
    testBuyerName: `買家_${Date.now()}`,
    testBuyerPhone: `0912${Math.floor(100000 + Math.random() * 900000)}`,
    testReceiverPhone: `0987${Math.floor(100000 + Math.random() * 900000)}`,
    testReceiverName: `收件人_${Date.now()}`,
    testAddress: `台北市信義區測試路 ${Math.floor(Math.random() * 100)} 號`,
    testEmail: `e2e_buyer_${Date.now()}@example.com`,
    testBuyerEmail: `e2e_buyer_${Date.now()}@example.com`
  });

  const addToCart = async (page: any) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // 1. 等待商品元素加載 (假設商品項有 data-testid="product-item" 或類似結構)
    // 這裡我們稍微寬鬆地等待頁面上有至少一個產品的加入購物車按鈕出現
    const addBtn = page.locator('button:has-text("加入購物車")').first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.scrollIntoViewIfNeeded();

    // 2. 監聽 API 響應並點擊
    const responsePromise = page.waitForResponse(
      (resp: any) => 
        (resp.url().includes('/cart') || resp.url().includes('/trpc/cart')) && 
        resp.request().method() === 'POST',
      { timeout: 10000 }
    ).catch(() => null);

    await addBtn.click({ force: true });
    
    // 等待 API 響應完成
    await responsePromise;

    // 3. 給予前端 State 更新反應時間，並檢查購物車數量 Badge 變化
    await page.waitForTimeout(1500);

    // 驗證購物車 Badge 圖示數值是否有改變 (根據常見 UI 結構，這裡假設有 class 包含 cart-badge 的元素)
    // 若無此元素，此檢查可選，但為了確保加入成功，我們進購物車頁面檢查
    
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('購物車目前是空的');
    await expect(page.locator('a[href="/checkout"], button:has-text("前往結帳")')).toBeVisible();
  }

  test('Member checkout', async ({ page }) => {
    const data = getTestData();
    const password = 'Password123!';

    await page.request.post('http://localhost:8080/api/auth/register', {
      data: { email: data.testEmail, password, name: data.testBuyerName }
    });
    
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill(data.testEmail);
    await page.getByPlaceholder('Password').fill(password);
    await page.click('button:has-text("登入")'); 

    await addToCart(page);

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // 填寫訂購人
    await page.getByPlaceholder('姓名').first().fill(data.testBuyerName);
    await page.getByPlaceholder('電話').first().fill(data.testBuyerPhone);
    // 填寫收件人 (強制填寫，不使用checkbox)
    await page.getByPlaceholder('姓名').nth(1).fill(data.testBuyerName);
    await page.getByPlaceholder('電話').nth(1).fill(data.testBuyerPhone);
    await page.getByPlaceholder('配送地址').fill(data.testAddress);
    
    // 使用 Promise.all 確保回應攔截與點擊同步
    const [orderRes] = await Promise.all([
      page.waitForResponse(res => (res.url().includes('/api/orders') || res.url().includes('/api/trpc/checkout') || res.url().includes('checkout')) && res.request().method() === 'POST'),
      page.click('button:has-text("送出訂單")')
    ]);
    
    await expect(orderRes.ok()).toBeTruthy();
    await page.waitForURL(/\/(profile\/orders|orders\/)/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(data.testBuyerName);
  });

  test('Guest gift checkout', async ({ page, context }) => {
    const guestPage = await context.newPage();
    const data = getTestData();
    
    await addToCart(guestPage);
    
    await guestPage.goto('/checkout');
    await guestPage.waitForLoadState('networkidle');
    
    await guestPage.getByPlaceholder('Email').fill(data.testEmail);
    
    // 填寫訂購人
    await guestPage.getByPlaceholder('姓名').first().fill(data.testBuyerName);
    await guestPage.getByPlaceholder('電話').first().fill(data.testBuyerPhone);
    
    // 填寫收件人
    await guestPage.getByPlaceholder('姓名').nth(1).fill(data.testReceiverName);
    await guestPage.getByPlaceholder('電話').nth(1).fill(data.testReceiverPhone);
    await guestPage.getByPlaceholder('配送地址').fill(data.testAddress);
    
    // 使用 Promise.all 確保回應攔截與點擊同步
    const [orderRes] = await Promise.all([
      guestPage.waitForResponse(res => (res.url().includes('/api/orders') || res.url().includes('/api/trpc/checkout') || res.url().includes('checkout')) && res.request().method() === 'POST'),
      guestPage.click('button:has-text("送出訂單")')
    ]);
    
    const resJson = await orderRes.json();
    const orderData = Array.isArray(resJson) ? resJson[0] : resJson;
    const realOrderId = orderData?.result?.data?.id || orderData?.data?.id || orderData?.id || orderData?.orderId;

    if (!realOrderId) {
      console.error('API Response JSON 結構找不到 ID:', JSON.stringify(orderData, null, 2));
      throw new Error('無法從 API 回應中取得訂單 ID');
    }

    await guestPage.waitForURL(/\/orders\//, { timeout: 15000 });
    
    await guestPage.goto('/order-tracking');
    await guestPage.waitForLoadState('networkidle');
    
    await guestPage.locator('label:has-text("訂單編號") + input').fill(realOrderId);
    console.log('Using Order ID for Tracking:', realOrderId);
    await guestPage.locator('label:has-text("Email") + input').fill(data.testBuyerEmail);
    console.log('Using Buyer Email for Tracking:', data.testBuyerEmail);
    
    // 重構點擊『查詢』後的同步等待機制
    const [trackRes] = await Promise.all([
      guestPage.waitForResponse(res => res.url().includes('/api/trpc') || res.url().includes('/api/orders')),
      guestPage.click('button:has-text("查詢")')
    ]);
    console.log('Track API Response Status:', trackRes.status(), await trackRes.json());
    
    await expect(guestPage.locator('body')).toContainText(data.testBuyerName);
    await expect(guestPage.locator('body')).toContainText(data.testReceiverName);
  });
});