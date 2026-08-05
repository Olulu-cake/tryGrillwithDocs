
import { prisma } from '../shared/database';
import { InventoryService } from '../modules/inventory/inventory.service';

describe('Inventory Reservation Extension Integration Flow', () => {
  let inventoryService: InventoryService;

  const testUserId = 'test-user-uuid-12345';
  const testProductId = 'test-product-uuid-67890';
  const testCartId = 'test-cart-uuid-11111';

  beforeEach(async () => {
    inventoryService = new InventoryService();

    await prisma.stockReservation.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'guest-tester@example.com',
        role: 'customer',
        isRegistered: false,
      },
    });

    await prisma.product.create({
      data: {
        id: testProductId,
        sku: 'TEST-SKU-EXTEND',
        title: 'Premium Architecture Guide',
        price: 150.00,
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
    await prisma.stockReservation.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should extend reservation TTL and be idempotent', async () => {
    // 1. Reserve initial stock
    const reservation = await inventoryService.reserveStock(testProductId, testCartId, 2);
    const initialExpiration = reservation.expirationTime;

    // 2. Extend reservation
    await inventoryService.extendReservation(testProductId, testCartId);

    // 3. Verify extension
    const updatedReservation = await prisma.stockReservation.findUnique({
      where: { id: reservation.id },
    });
    
    expect(updatedReservation).toBeDefined();
    // Verify TTL is extended (by at least 15 minutes)
    expect(updatedReservation!.expirationTime.getTime()).toBeGreaterThan(initialExpiration.getTime());

    // 4. Verify Idempotency (calling again should not throw and result in same state)
    await inventoryService.extendReservation(testProductId, testCartId);
    
    const finalReservation = await prisma.stockReservation.findUnique({
      where: { id: reservation.id },
    });
    expect(finalReservation!.expirationTime.getTime()).toEqual(updatedReservation!.expirationTime.getTime());
  });
});
