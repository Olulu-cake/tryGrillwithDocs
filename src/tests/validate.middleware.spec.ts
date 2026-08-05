
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../shared/validate.middleware';

describe('validate middleware', () => {
  const schema = z.object({
    body: z.object({
      name: z.string(),
      age: z.number(),
    }),
  });

  it('should validate and sanitize input, and pass to next()', async () => {
    const req = {
      body: { name: 'John', age: 30, extra: 'field' },
    } as Partial<Request>;
    const res = {} as Response;
    const next = jest.fn() as unknown as NextFunction;

    const middleware = validate(schema);
    await middleware(req as Request, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'John', age: 30 }); // Unknown field 'extra' stripped
    expect(req.body).not.toHaveProperty('extra');
  });

  it('should reject invalid input and return 400 with correlationId', async () => {
    const req = {
      body: { name: 'John' }, // Missing age
      headers: { 'x-correlation-id': 'test-id' },
    } as Partial<Request>;
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    
    const next = jest.fn() as unknown as NextFunction;

    const middleware = validate(schema);
    await middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
        correlationId: 'test-id',
      })
    );
  });
});
