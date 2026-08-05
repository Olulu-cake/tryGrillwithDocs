
import { Request, Response, NextFunction } from 'express';
import { authRbacGuard } from '../shared/auth-rbac.guard';
import jwt from 'jsonwebtoken';
import { logger } from '../shared/logger';

jest.mock('jsonwebtoken');
jest.mock('../shared/logger');

describe('Auth & RBAC Guard', () => {
  const req = {
    headers: { authorization: 'Bearer valid-token' },
    body: { adminUserId: 'admin1', reason: 'Retrying stuck shipment' },
  } as any;
  const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
  const next = jest.fn();

  it('should reject requests without a valid JWT token', () => {
    jest.mocked(jwt.verify).mockImplementation(() => { throw new Error('Invalid'); });
    
    const guard = authRbacGuard('fulfillment:dlq:write');
    guard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject requests from non-admin users or users missing required scope', () => {
    jest.mocked(jwt.verify).mockReturnValue({ role: 'USER', scopes: ['read:only'] });
    const guard = authRbacGuard('fulfillment:dlq:write');
    
    guard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access and enforce audit logging for manual DLQ retries', () => {
    jest.mocked(jwt.verify).mockReturnValue({ role: 'ROLE_ADMIN', scopes: ['fulfillment:dlq:write'] });
    const loggerSpy = jest.spyOn(logger, 'info');
    
    const guard = authRbacGuard('fulfillment:dlq:write');
    guard(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(expect.objectContaining({
      event: 'MANUAL_DLQ_OVERRIDE',
      adminUserId: 'admin1',
    }));
  });
});
