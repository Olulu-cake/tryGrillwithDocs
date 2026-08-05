
import { prisma } from '../shared/database';
import { InventoryService } from '../modules/inventory/inventory.service';
import { OrderService } from '../modules/orders/order.service';

// Services
const inventoryService = new InventoryService(prisma);
const orderService = new OrderService(prisma);

describe('Guest Cart Merging Integration', () => {
  beforeEach(async () => {
    // Cleanup DB
    await prisma.stockReservation.deleteMany({});
  });

  it('should sum quantities of the same item when merging guest and user carts', async () => {
    const userId = 'user-123';
    const productId = 'prod-1';
    
    // 0. Setup: Need product and stock first
    const product = await prisma.product.upsert({
      where: { id: productId },
      update: {},
      create: { id: productId, sku: 'SKU1', title: 'Test Product', price: 10.0 }
    });
    await prisma.inventoryItem.upsert({
      where: { productId: product.id },
      update: { availableStock: 10 },
      create: { productId: product.id, availableStock: 10 }
    });

    // 1. Setup: User has 1 item, Guest has 2 items of the same product
    await inventoryService.reserveStock(productId, userId, 1);
    await inventoryService.reserveStock(productId, 'session-abc', 2);

    // 2. Action: Merge Guest cart into User cart
    await orderService.mergeCart('session-abc', userId);

    // 3. Validation: Total reserved should be 3
    const reservation = await prisma.stockReservation.findFirst({
        where: { productId, cartId: userId }
    });
    
    expect(reservation?.quantity).toBe(3);
  });
});
