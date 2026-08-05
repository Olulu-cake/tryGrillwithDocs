import { prisma } from './shared/database';
import { OrderService } from './modules/orders/order.service';
import { InventoryService } from './modules/inventory/inventory.service';
import { cartService } from './modules/cart/cart.service';

const orderService = new OrderService();
const inventoryService = new InventoryService();

/**
 * Checkout Controller Logic
 */
export async function initiateCheckout(userId: string, guestCartId: string, userCartId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Merge carts
    await cartService.mergeCart(guestCartId, userCartId);

    // 2. Extend reservations and prepare order items
    const reservations = await tx.stockReservation.findMany({
      where: { cartId: userCartId },
    });

    let totalAmount = 0;
    const items: Array<{ productId: string; quantity: number; price: number }> = [];

    for (const reservation of reservations) {
      // Extend reservation
      await inventoryService.extendReservation(reservation.productId, userCartId);
      
      // Fetch product price
      const product = await tx.product.findUnique({
        where: { id: reservation.productId },
      });
      if (!product) throw new Error('Product not found');
      
      // Calculate total and prepare items
      totalAmount += product.price.toNumber() * reservation.quantity;
      items.push({
        productId: reservation.productId,
        quantity: reservation.quantity,
        price: product.price.toNumber(),
      });
    }

    // 3. Create order
    // In a real scenario, this would be passed into initiateCheckout.
    const orderData = {
      buyer: {
        name: 'Guest',
        email: 'guest@example.com',
      },
      receiver: {
        name: 'Guest',
        shippingAddress: 'N/A',
      },
      userId
    };
    
    // Create order using Prisma directly to ensure data integrity
    return await tx.order.create({
      data: {
        userId,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        fulfillmentStatus: 'PENDING',
        totalAmount: totalAmount,
        shippingAmount: 0,
        buyerName: orderData.buyer.name,
        buyerEmail: orderData.buyer.email,
        receiverName: orderData.receiver.name,
        shippingAddress: orderData.receiver.shippingAddress,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
          }))
        }
      }
    });
  });
}
