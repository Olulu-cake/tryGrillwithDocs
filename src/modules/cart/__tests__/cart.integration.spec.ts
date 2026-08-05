import request from 'supertest';
import { app } from '../../../app';

describe('Cart Integration', () => {
  // 1. [CORS 憑證測試]
  it('GET /api/cart should have access-control-allow-credentials: true', async () => {
    const response = await request(app).get('/api/cart');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  // 2. [Populate 與 DTO 測試]
  it('GET /api/cart should return valid structure with populated items', async () => {
    const response = await request(app).get('/api/cart');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cart');
    expect(response.body.cart).toHaveProperty('items');
    
    if (response.body.cart.items.length > 0) {
      const item = response.body.cart.items[0];
      expect(typeof item.title).toBe('string');
      expect(typeof item.price).toBe('number');
      expect(typeof item.stock).toBe('number');
      expect(typeof item.subtotal).toBe('number');
    }
  });

  // 3. [庫存邊界測試]
  it('POST /api/cart/items should return 400 when quantity exceeds stock', async () => {
    // Assuming product ID 'test-product-1' exists in seeded data
    const response = await request(app)
      .post('/api/cart/items')
      .send({
        productId: 'test-product-1',
        quantity: 999
      });
      
    expect(response.status).toBe(400);
  });
});
