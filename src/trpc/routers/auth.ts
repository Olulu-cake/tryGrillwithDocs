import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { AuthService } from '../../modules/auth/auth.service';

const authService = new AuthService();

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      return await authService.login(input.email, input.password);
    }),
  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string(), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await authService.register(input.email, input.password, input.name);
    }),
  me: publicProcedure.query(({ ctx }) => {
    // Assuming context has user info populated via middleware or just return null if not authorized
    // @ts-ignore
    return ctx.req.user || null;
  }),
});
