
import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';
import { prisma } from '../shared/database';

jest.mock('jsonwebtoken');
jest.mock('../shared/database', () => ({
  prisma: {
    product: {
      create: jest.fn().mockResolvedValue({ id: 'prod1', title: 'New Product', price: 100 }),
    },
  },
}));

describe('Admin API Integration', () => {
  const adminToken = 'admin-token';
  const userToken = 'user-token';

  it('should allow admin to create a product', async () => {
    jest.mocked(jwt.verify).mockReturnValue({ role: 'ROLE_ADMIN', scopes: ['admin:all'] });
    
    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'New Product', price: 100 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should forbid non-admin from creating a product', async () => {
    jest.mocked(jwt.verify).mockReturnValue({ role: 'USER', scopes: ['read:only'] });
    
    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'New Product', price: 100 });

    expect(response.status).toBe(403);
  });

  it('should allow admin to inspect reconciliation mismatches', async () => {
    jest.mocked(jwt.verify).mockReturnValue({ role: 'ROLE_ADMIN', scopes: ['admin:all'] });
    
    const response = await request(app)
      .get('/api/admin/reconciliation/mismatches')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
