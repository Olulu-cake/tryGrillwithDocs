import { cartService } from '../cart/cart.service';
import { catalogService } from '../catalog/catalog.service';
import { Order, BuyerInfo, ReceiverInfo, OrderItemSnapshot } from './order.types';
import { prisma } from '../../shared/database';

export class OrderService {
  private orders: Map<string, Order> = new Map();

  async createOrder(orderData: { buyer: BuyerInfo, receiver: ReceiverInfo, userId?: string }, fallbackItems?: any[], fallbackTotal?: number) {
    const { buyer, receiver, userId } = orderData;
    const cartId = 'cart-123';
    
    let items: any[] = [];
    try {
      const sessionCart = await cartService.getCart(cartId);
      if (sessionCart && sessionCart.items && sessionCart.items.length > 0) {
        items = sessionCart.items;
      }
    } catch (e) {
      console.log('[Order Service] Session cart fetch failed, using fallback items.');
    }

    if ((!items || items.length === 0) && fallbackItems && fallbackItems.length > 0) {
      items = fallbackItems;
    }

    if (!items || items.length === 0) {
      throw new Error('購物車為空，無法建立訂單');
    }

    try {
      // Check inventory
      for (const item of items) {
        const product = await catalogService.getProductById(item.productId);
        if (!product || (product.inventory?.availableStock || 0) < item.quantity) {
          throw new Error('商品 ' + (product?.title || item.productId) + ' 庫存不足');
        }
      }

      // Deduct stock
      for (const item of items) {
        await prisma.inventoryItem.update({
          where: { productId: item.productId },
          data: {
            availableStock: { decrement: item.quantity },
          },
        });
      }

      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Store in Prisma
      await prisma.order.create({
        data: {
          id: orderId,
          userId,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          fulfillmentStatus: 'PENDING',
          totalAmount: fallbackTotal || items.reduce((sum, i) => sum + i.subtotal, 0),
          shippingAmount: 0,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          buyerPhone: buyer.phone,
          receiverName: receiver.name,
          receiverPhone: receiver.phone,
          shippingAddress: receiver.shippingAddress || '',
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.price,
            })),
          },
        },
      });

      const itemsSnapshot: OrderItemSnapshot[] = items.map(item => ({
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }));

      const newOrder: Order = {
        id: orderId,
        userId,
        buyer,
        receiver,
        items: itemsSnapshot,
        totalAmount: fallbackTotal || items.reduce((sum, i) => sum + i.subtotal, 0),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      this.orders.set(orderId, newOrder);
      await cartService.clearCart(cartId);
      
      // Clear stock reservations in the database
      await prisma.stockReservation.deleteMany({
        where: { cartId },
      });
      
      return newOrder;
    } catch (err: any) {
      console.error('[OrderService] Failed to create order:', err);
      throw new Error(err.message || '建立訂單失敗');
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async getGuestOrder(orderId: string, email: string) {
    const order = await prisma.order.findUnique({ 
        where: { id: orderId }, 
        include: { items: true } 
    });

    if (!order) {
        return null;
    }

    if (order.buyerEmail) {
        if (order.buyerEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
            return null;
        }
    }

    return order;
  }

  async getOrdersByUserId(userId: string, email: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => {
      const matchesUserId = order.userId === userId;
      const matchesEmail = order.buyer.email === email;
      return matchesUserId || matchesEmail;
    });
  }
}

export const orderService = new OrderService();
