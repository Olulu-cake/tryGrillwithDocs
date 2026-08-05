import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/shared/database';

describe('Basic Connectivity', () => {
  it('should return 200 and success message on GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, my-app is running successfully!');
  });

  afterAll(async () => {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  });
});
