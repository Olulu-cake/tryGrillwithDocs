import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from './logger'; // Assuming logger is available

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

export const authRbacGuard = (requiredScope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send('Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    try {
      const user = jwt.verify(token, JWT_SECRET) as any;
      (req as any).user = user;

      // Role check (assuming user object has role)
      if (user.role !== 'ROLE_ADMIN') {
        return res.status(403).send('Forbidden');
      }

      // Scope check
      if (!user.scopes || (!user.scopes.includes(requiredScope) && !user.scopes.includes('admin:all'))) {
        return res.status(403).send('Forbidden');
      }

      // Audit Logging for manual DLQ retries
      if (requiredScope === 'fulfillment:dlq:write') {
        const { adminUserId, reason } = req.body;
        if (!adminUserId || !reason) {
          return res.status(400).send('Bad Request: Missing audit information');
        }
        
        logger.info({
          event: 'MANUAL_DLQ_OVERRIDE',
          adminUserId,
          reason,
          timestamp: new Date().toISOString(),
          msg: 'AUDIT: Manual DLQ override triggered',
        });
      }

      next();
    } catch (err) {
      return res.status(401).send('Unauthorized');
    }
  };
};
