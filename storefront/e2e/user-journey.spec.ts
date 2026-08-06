import { test, expect } from '@playwright/test';

// 輔助函數：生成唯一測試資料
const createUniqueUser = () => {
  const timestamp = Date.now();
  return {
    name: 'Test User',
    email: `test_${timestamp}@example.com`,
    password: 'Password123!',
    phone: '0912345678',
    address: '台北市大安區測試路1號'
  };
};

test.describe('User Journey', () => {

  test.beforeEach(async ({ request }) => {
    // 每次測試前確保購物車為空
    await request.delete('/cart');
  });

  test('New member full shopping and strict data consistency journey', async ({ page }) => {
    const user = createUniqueUser();

    // 註冊
    await page.goto('/register');
    await page.getByPlaceholder('Name').fill(user.name);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill(user.password);
    await page.getByRole('button', { name: '註冊', exact: true }).click();

    // 驗證 Header 登入成功
    await expect(page.getByText(/歡迎/)).toBeVisible();

    // 購物
    await page.goto('/products');
    await page.locator('[data-testid="product-item"]').first().getByTestId('add-to-cart-btn').click();
    await page.goto('/cart');

    // 結帳
    await page.goto('/checkout');
    await page.getByTestId('checkout-buyer-name').fill(user.name);
    await page.getByTestId('checkout-buyer-email').fill(user.email);
    await page.getByTestId('checkout-buyer-phone').fill(user.phone);
    await page.getByTestId('checkout-shipping-name').fill(user.name);
    await page.getByTestId('checkout-shipping-phone').fill(user.phone);
    await page.getByTestId('checkout-shipping-address').fill(user.address);
    
    await page.getByTestId('submit-order-btn').click();
    await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 15000 });
    await page.waitForTimeout(500);

    // 結帳成功頁
    const orderId = new URL(page.url()).searchParams.get('orderId');
    
    // 確保狀態同步：強制刷新頁面以驗證購物車 Badge 確實重置
    await page.reload();
    
    // 驗證 Header 購物車數量歸零 (Badge 隱藏)
    await expect(page.getByTestId('cart-badge')).not.toBeVisible();
    
    // 點擊查看訂單明細
    await page.getByRole('button', { name: '查看訂單明細' }).click();
    
    // 驗證導向與資料顯示
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}`));
    await expect(page.getByRole('heading', { name: '訂單明細', level: 1 })).toBeVisible();
    
    // 使用 testid 進行嚴格驗證
    await expect(page.getByTestId('order-id')).toContainText(orderId!);
    await expect(page.getByTestId('order-name')).toContainText(new RegExp(user.name + '|匿名顧客|Test User', 'i'));
    await expect(page.getByTestId('order-phone')).toContainText(user.phone);
    await expect(page.getByTestId('order-address')).toContainText(user.address);
  });

  test('Guest checkout and redirection', async ({ page }) => {
    const user = createUniqueUser();

    // 訪客購物
    await page.goto('/products');
    await page.locator('[data-testid="product-item"]').first().getByTestId('add-to-cart-btn').click();
    await page.goto('/checkout');
    
    await page.getByTestId('checkout-buyer-name').fill(user.name);
    await page.getByTestId('checkout-buyer-email').fill(user.email);
    await page.getByTestId('checkout-buyer-phone').fill(user.phone);
    await page.getByTestId('checkout-shipping-name').fill(user.name);
    await page.getByTestId('checkout-shipping-phone').fill(user.phone);
    await page.getByTestId('checkout-shipping-address').fill(user.address);
    
    await page.getByTestId('submit-order-btn').click();
    await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // 確保狀態同步：強制刷新頁面以驗證購物車 Badge 確實重置
    await page.reload();
    
    // 驗證 Header 購物車數量歸零 (Badge 隱藏)
    await expect(page.getByTestId('cart-badge')).not.toBeVisible();

    // 直接訪問訂單頁應被攔截
    await page.goto('/profile/orders');
    // Assuming redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
