import request from 'supertest';
import { app } from '../src/app';
import { prismaMock } from './setup';
import bcrypt from 'bcrypt';

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const user = { 
      id: '1', email, password: 'hashedPassword', role: 'customer', isRegistered: true, createdAt: new Date(), updatedAt: new Date() 
    };
    
    // Mock bcrypt.hash and compare (for login)
    jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashedPassword');
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
    
    // Mock prisma.user.findUnique: first call (register: existingUser=null), second call (login: found)
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.user.create.mockResolvedValue(user);
    
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login', async () => {
    const email = 'login@example.com';
    const password = 'password123';
    
    // Mock bcrypt.compare
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
    
    // Mock prisma.user.findUnique
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1', email, password: 'hashedPassword', role: 'customer', isRegistered: true, createdAt: new Date(), updatedAt: new Date()
    });
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail login with wrong password', async () => {
    const email = 'wrong@example.com';
    const password = 'wrongpassword';
    
    // Mock bcrypt.compare
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
    
    // Mock prisma.user.findUnique
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1', email, password: 'hashedPassword', role: 'customer', isRegistered: true, createdAt: new Date(), updatedAt: new Date()
    });
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    
    expect(res.status).toBe(401);
  });
});
