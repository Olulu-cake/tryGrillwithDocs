import request from 'supertest';
import { app } from '../src/app';

describe('App API Integration Tests', () => {
  it('GET / should return 200 and success message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, my-app is running successfully!');
  });

  it('GET /undefined-route should return 404', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
  });
});
