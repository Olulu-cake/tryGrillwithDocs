import request from 'supertest';
import { app } from '../src/app';
import { prismaMock } from './setup';

describe('Orders API', () => {
  it('POST /api/orders - should create a PENDING order', async () => {
    const mockOrder = {
      id: 'order-1',
      userId: 'user-123',
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
        items: [
          { productId: 'prod-1', quantity: 2 }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 'order-1');
    expect(response.body.status).toBe('PENDING');
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
