
import crypto from 'crypto';
import { webhookHmacMiddleware } from '../shared/webhook-hmac.middleware';

describe('Webhook HMAC Middleware', () => {
  const secret = 'test-secret';
  
  // Mock process.env for testing
  jest.stubEnv('WEBHOOK_SECRET', secret);

  it('should reject requests with an invalid signature (Red Light)', () => {
    const req = {
      headers: {
        'x-hub-signature': 'sha256=invalid-signature',
        'x-timestamp': Date.now().toString(),
      },
      body: JSON.stringify({ event: 'test' }),
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    webhookHmacMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject requests with an expired timestamp (replay attack)', () => {
    const expiredTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    const req = {
      headers: {
        'x-hub-signature': 'sha256=some-signature',
        'x-timestamp': expiredTimestamp.toString(),
      },
      body: JSON.stringify({ event: 'test' }),
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    webhookHmacMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass requests with a valid signature and timestamp', () => {
    const timestamp = Date.now().toString();
    const body = JSON.stringify({ event: 'test' });
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const signature = `sha256=${hmac.digest('hex')}`;

    const req = {
      headers: {
        'x-hub-signature': signature,
        'x-timestamp': timestamp,
      },
      body: body,
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    webhookHmacMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
