import request from 'supertest';
import { app } from '../src/app';
import { prismaMock } from './setup';

describe('Payments API', () => {
  describe('POST /api/payments/checkout', () => {
    it('should return 200 and payment parameters', async () => {
      const orderId = 'test-order-id';
      
      // Setup mock
      prismaMock.order.findUnique.mockResolvedValue({
        id: orderId,
        totalAmount: 100,
        status: 'PENDING',
      } as any);

      const response = await request(app)
        .post('/api/payments/checkout')
        .send({ orderId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentUrl');
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should return 200 and update order status to PAID', async () => {
      const orderId = 'test-order-id';

      // Setup mock
      prismaMock.order.findUnique.mockResolvedValue({
        id: orderId,
        status: 'PENDING',
      } as any);
      
      prismaMock.order.update.mockResolvedValue({
        id: orderId,
        status: 'PAID',
      } as any);

      const response = await request(app)
        .post('/api/payments/webhook')
        .send({ orderId, status: 'SUCCESS' });

      expect(response.status).toBe(200);
      expect(prismaMock.order.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: orderId },
        data: { status: 'PAID', paymentStatus: 'PAID' },
      }));
    });
  });
});
