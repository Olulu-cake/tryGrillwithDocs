import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret';
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export const webhookHmacMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-hub-signature'] as string;
  const timestampHeader = req.headers['x-timestamp'] as string;

  if (!signature || !timestampHeader) {
    return res.status(401).send('Unauthorized');
  }

  // 1. Anti-Replay Attack: Check timestamp tolerance
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp) || Math.abs(Date.now() - timestamp) > TIMESTAMP_TOLERANCE_MS) {
    return res.status(401).send('Unauthorized');
  }

  // 2. Signature Validation: Use timingSafeEqual
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(req.body);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedSignatureBuffer.length || 
      !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return res.status(401).send('Unauthorized');
  }

  next();
};
