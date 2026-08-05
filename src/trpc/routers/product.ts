import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { catalogService } from '../../modules/catalog/catalog.service';

export const productRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      sortBy: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await catalogService.getProducts(input);
    }),
  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await catalogService.getProductById(input);
    }),
});
