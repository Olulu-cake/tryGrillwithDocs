
import { prisma } from '../shared/database';
import { eventBus } from '../shared/event-bus';
import { OrderService } from '../modules/orders/order.service';
import { InventoryService } from '../modules/inventory/inventory.service';

describe('Checkout Integration Flow with Asynchronous Event Bus', () => {
  let orderService: OrderService;
  let inventoryService: InventoryService;

  // 建立固定的測試 UUID 欄位，確保測試數據的邏輯參考合規
  const testUserId = 'test-user-uuid-12345';
  const testProductId = 'test-product-uuid-67890';
  const testSku = 'TEST-SKU-PREMIUM-POSTGRES';

  beforeEach(async () => {
    orderService = new OrderService();
    inventoryService = new InventoryService();

    // 🛡️ 生產級防禦性測試清理：依據依賴關係從最底層開始清理舊資料，避免重複執行測試時發生主鍵或外鍵衝突
    await prisma.stockReservation.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // 📦 測試數據初始化 (Seeding)
    // 1. 建立測試用的訪客影子帳號 (Guest Shadow Account)
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'guest-tester@example.com',
        role: 'customer',
        isRegistered: false,
      },
    });

    // 2. 建立測試商品，並使用 PostgreSQL 高精度 Decimal 格式初始化 10 件可售庫存
    await prisma.product.create({
      data: {
        id: testProductId,
        sku: testSku,
        title: 'Premium Architecture Guide (PostgreSQL Edition)',
        price: 150.00, // 在實體庫上會被完美精準存入為 Decimal 類型
        inventory: {
          create: {
            availableStock: 10,
            reservedStock: 0,
          },
        },
      },
    });
  });

  afterEach(async () => {
    // 🧹 測試完畢清理戰場，保持新加坡 Neon 雲端實體資料庫完全乾淨
    await prisma.stockReservation.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should complete the entire checkout flow atomically and broadcast order.paid asynchronously', async () => {
    // ----------------------------------------------------
    // 【第一步：建立訂單 (Checkout Start)】
    // ----------------------------------------------------
    const items = [{ productId: testProductId, quantity: 2, price: 150.00 }];
    const totalAmount = 300.00;
    
    const order = await orderService.createOrder(testUserId, items, totalAmount);
    
    expect(order).toBeDefined();
    expect(order.status).toBe('PENDING');
    expect(order.paymentStatus).toBe('UNPAID');
    expect(order.fulfillmentStatus).toBe('UNFULFILLED');

    // ----------------------------------------------------
    // 【第二步：庫存原子化預留 (Inventory Lock)】
    // ----------------------------------------------------
    // 呼叫我們在實體 PostgreSQL 上運行的樂觀鎖條件更新（updateMany）
    const reservation = await inventoryService.reserveStock(testProductId, order.id, 2);
    
    expect(reservation).toBeDefined();
    expect(reservation.quantity).toBe(2);

    // 從實體資料庫即時驗證：可售庫存是否確實下降，預留庫存是否確實上升
    const updatedInventory = await prisma.inventoryItem.findUnique({
      where: { productId: testProductId },
    });
    expect(updatedInventory?.availableStock).toBe(8);  // 10 - 2 = 8
    expect(updatedInventory?.reservedStock).toBe(2);   // 0 + 2 = 2

    // ----------------------------------------------------
    // 【💡 核心神經網路驗證：手動訂閱 EventBus 監聽】
    // ----------------------------------------------------
    // 在執行付款前，我們在測試中先向單例 eventBus 註冊監聽器，捕捉等一下要噴發的非同步事件
    let isEventFired = false;
    let receivedPayload: any = null;

    await eventBus.subscribe('order.paid', async (event) => {
      isEventFired = true;
      receivedPayload = event.payload;
    });

    // ----------------------------------------------------
    // 【第三步：金流成功狀態機流轉與事件噴發 (Payment Success)】
    // ----------------------------------------------------
    // 呼叫具備原子防護更新的 handleOrderPaid 方法
    const paidOrder = await orderService.handleOrderPaid(order.id);
    
    // 斷言：驗證訂單核心狀態、金流狀態、物流起點狀態在單一原子 Transaction 內流轉成功！
    expect(paidOrder).toBeDefined();
    expect(paidOrder!.status).toBe('PAID');
    expect(paidOrder!.paymentStatus).toBe('PAID');
    expect(paidOrder!.fulfillmentStatus).toBe('AWAITING_SHIPMENT'); // 順利引導至待出貨！

    // ----------------------------------------------------
    // 【⏳ 核心神經網路斷言：等待非同步事件循環】
    // ----------------------------------------------------
    // 由於我們在 EventBus 中使用了 `setImmediate` 進行優雅的非同步解耦解鎖，
    // 我們在這裡給予 Node.js 事件循環 50 毫秒的極速緩衝時間，讓背景事件發布完畢。
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 終極黃金斷言：驗證 EventBus 是否真的在背景把事件成功擴散出去，且資料完全正確！
    expect(isEventFired).toBe(true);
    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.orderId).toBe(order.id); // 確保物流模組拿到的 orderId 100% 正確
  });
});