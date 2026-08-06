import { Request } from 'express';
import crypto from 'crypto';

export const getCartId = (req: Request) => {
  return (req.headers['x-cart-id'] as string) || (req.cookies?.cartId as string) || crypto.randomUUID();
};
