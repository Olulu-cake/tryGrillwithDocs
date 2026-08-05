import { orderService } from './order.service';
import { cartService } from '../cart/cart.service';
import { catalogService } from '../catalog/catalog.service';

// Mock dependencies
jest.mock('../cart/cart.service');
jest.mock('../catalog/catalog.service');
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      inventoryItem: {
        update: jest.fn(),
      },
    })),
  };
});

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if both cart and fallback are empty', async () => {
    (cartService.getCart as jest.Mock).mockResolvedValue({ items: [] });
    
    await expect(orderService.createOrder('cart-1', { name: 'Test', email: 'test@test.com', phone: '123', address: 'Addr', paymentMethod: 'CREDIT_CARD' }, [], 0))
      .rejects.toThrow('購物車為空，無法建立訂單');
  });

  it('should use fallback items if cart is empty', async () => {
    (cartService.getCart as jest.Mock).mockResolvedValue({ items: [] });
    const fallbackItems = [{ productId: 'prod-1', title: 'Prod 1', quantity: 1, price: 10, subtotal: 10 }];
    (catalogService.getProductById as jest.Mock).mockResolvedValue({ 
        inventory: { availableStock: 10 } 
    });

    const order = await orderService.createOrder('cart-1', { name: 'Test', email: 'test@test.com', phone: '123', address: 'Addr', paymentMethod: 'CREDIT_CARD' }, fallbackItems, 10);
    expect(order.items[0].productId).toBe('prod-1');
  });

  it('should throw error if inventory is insufficient', async () => {
    const mockCart = { 
      items: [{ productId: 'prod-1', title: 'Prod 1', quantity: 5, price: 10, subtotal: 50 }],
      totalAmount: 50 
    };
    (cartService.getCart as jest.Mock).mockResolvedValue(mockCart);
    (catalogService.getProductById as jest.Mock).mockResolvedValue({ 
        title: 'Prod 1',
        inventory: { availableStock: 2 } 
    });

    await expect(orderService.createOrder('cart-1', { name: 'Test', email: 'test@test.com', phone: '123', address: 'Addr', paymentMethod: 'CREDIT_CARD' }, [], 0))
      .rejects.toThrow('商品 Prod 1 庫存不足');
  });
});
