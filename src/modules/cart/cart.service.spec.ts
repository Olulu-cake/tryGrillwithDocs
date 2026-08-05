import { cartService } from './cart.service';
import { catalogService } from '../catalog/catalog.service';

// Mock catalogService to avoid DB dependencies in unit tests
jest.mock('../catalog/catalog.service', () => ({
  catalogService: {
    getProductById: jest.fn(),
  },
}));

describe('CartStore Unit Test', () => {
  beforeEach(() => {
    cartService.clearCart('cart-123');
    jest.clearAllMocks();
  });

  it('should add item to cart', async () => {
    (catalogService.getProductById as jest.Mock).mockResolvedValue({ 
      id: 'prod-1', 
      title: 'Product 1', 
      price: 10,
      inventory: { availableStock: 10 } 
    });
    
    await cartService.addItem('cart-123', 'prod-1', 2);
    const cart = await cartService.getCart('cart-123');
    
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: 'prod-1', quantity: 2 });
  });

  it('should update quantity if item exists', async () => {
    (catalogService.getProductById as jest.Mock).mockResolvedValue({ 
      id: 'prod-1', 
      title: 'Product 1', 
      price: 10,
      inventory: { availableStock: 10 } 
    });
    
    await cartService.addItem('cart-123', 'prod-1', 1);
    await cartService.addItem('cart-123', 'prod-1', 2);
    
    const cart = await cartService.getCart('cart-123');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });
});
