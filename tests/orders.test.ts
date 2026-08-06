import request from 'supertest';
import { app } from '../src/app';
import { prismaMock } from './setup';

describe('Orders API', () => {
  const userId = 'user-test-' + Date.now();
  it('POST /api/orders - should create a PENDING order', async () => {
    const mockOrder = {
      id: 'order-1',
      userId: userId,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      fulfillmentStatus: 'PENDING',
      totalAmount: 100,
      shippingAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    prismaMock.order.create.mockResolvedValue(mockOrder as any);

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer test-token')
      .send({
        userId: userId,
        items: [
          { productId: 'prod-1', quantity: 2 }
        ],
        totalAmount: 100
      });

    expect(response.status).toBe(200);
    expect(response.body.order).toHaveProperty('id', 'order-1');
  });

  it('GET /api/orders - should retrieve own orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([{ id: 'order-1' } as any]);

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe('order-1');
  });
});
