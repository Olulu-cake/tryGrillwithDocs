import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { orderService } from '../../modules/orders/order.service';
import { getCartId } from '../../shared/utils';

export const checkoutRouter = router({
  createOrder: publicProcedure
    .input(z.object({
      buyer: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }),
      receiver: z.object({
        name: z.string(),
        phone: z.string(),
        shippingAddress: z.string(),
      }),
      userId: z.string().optional(),
      fallbackItems: z.array(z.object({
        productId: z.string(),
        quantity: z.number(),
        price: z.number(),
        subtotal: z.number(),
        title: z.string().optional(),
      })).optional(),
      fallbackTotal: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await orderService.createOrder(
        { 
          buyer: input.buyer, 
          receiver: input.receiver, 
          userId: input.userId,
          cartId: getCartId(ctx.req) 
        },
        input.fallbackItems,
        input.fallbackTotal
      );
    }),
});
