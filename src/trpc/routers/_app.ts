import { router } from '../trpc';
import { orderRouter } from './order';
import { authRouter } from './auth';
import { productRouter } from './product';
import { checkoutRouter } from './checkout';

export const appRouter = router({
    order: orderRouter,
    auth: authRouter,
    products: productRouter,
    checkout: checkoutRouter,
});

export type AppRouter = typeof appRouter;
