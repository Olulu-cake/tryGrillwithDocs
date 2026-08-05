import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { orderService } from '../../modules/orders/order.service';

export const orderRouter = router({
    trackOrder: publicProcedure
        .input(z.object({ orderId: z.string(), email: z.string().email() }))
        .query(async ({ input }) => {
            return await orderService.getGuestOrder(input.orderId, input.email);
        }),
});
