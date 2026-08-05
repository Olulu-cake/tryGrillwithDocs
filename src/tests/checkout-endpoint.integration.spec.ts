
import { prisma } from '../shared/database';
import { initiateCheckout } from '../checkout.controller';

describe('Checkout Endpoint Integration', () => {
  const testUserId = 'test-user-uuid-12345';
  const testGuestCartId = 'guest-cart-uuid-999';
  const testUserCartId = 'user-cart-uuid-000';
  const testProductId = 'test-product-uuid-67890';

  beforeEach(async () => {
    await prisma.stockReservation.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'tester@example.com',
        role: 'customer',
        isRegistered: true,
      },
    });

    await prisma.product.create({
      data: {
        id: testProductId,
        sku: 'TEST-SKU-ENDPOINT',
        title: 'Premium Product',
        price: 100.00,
        inventory: {
          create: {
            availableStock: 10,
            reservedStock: 0,
          },
        },
      },
    });

    // Seed guest reservation
    await prisma.stockReservation.create({
      data: {
        productId: testProductId,
        cartId: testGuestCartId,
        quantity: 1,
        expirationTime: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    await prisma.stockReservation.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should merge carts, extend reservations, and create a pending order', async () => {
    const order = await initiateCheckout(testUserId, testGuestCartId, testUserCartId);

    expect(order).toBeDefined();
    expect(order.status).toBe('PENDING');

    // Verify cart merged
    const reservations = await prisma.stockReservation.findMany({
      where: { cartId: testUserCartId },
    });
    expect(reservations.length).toBe(1);
    expect(reservations[0].productId).toBe(testProductId);
  });
});
