
import { Request, Response, NextFunction } from 'express';
import { correlationMiddleware } from '../shared/correlation.middleware';
import { contextStorage } from '../shared/context';

describe('Correlation Middleware', () => {
  it('should generate a correlation ID if missing', async () => {
    const req = { headers: {} } as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    let capturedCorrelationId: string | undefined;
    
    const next = jest.fn(async () => {
      capturedCorrelationId = contextStorage.getStore()?.correlationId;
    }) as NextFunction;

    await correlationMiddleware(req, res, next);

    expect(req.headers['x-correlation-id']).toBeDefined();
    expect(req.headers['x-correlation-id']).toMatch(/^req-/);
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.stringContaining('req-'));
    expect(next).toHaveBeenCalled();
    expect(capturedCorrelationId).toMatch(/^req-/);
  });

  it('should use provided correlation ID from header', async () => {
    const req = { headers: { 'x-correlation-id': 'provided-id' } } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    let capturedCorrelationId: string | undefined;
    
    const next = jest.fn(async () => {
      capturedCorrelationId = contextStorage.getStore()?.correlationId;
    }) as NextFunction;

    await correlationMiddleware(req, res, next);

    expect(req.headers['x-correlation-id']).toBe('provided-id');
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', 'provided-id');
    expect(capturedCorrelationId).toBe('provided-id');
  });
});
