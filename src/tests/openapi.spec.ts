
import request from 'supertest';
import { app } from '../app';

describe('OpenAPI documentation', () => {
  it('should serve a valid OpenAPI 3.0 specification at /api-docs.json', async () => {
    const response = await request(app).get('/api-docs.json');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('openapi', '3.0.0');
    expect(response.body).toHaveProperty('info');
    expect(response.body.info).toHaveProperty('title', 'E-Commerce API');
  });
});
