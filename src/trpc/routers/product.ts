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
      // 確保僅查詢已發布且有庫存的商品
      const modifiedInput = {
        ...input,
        status: 'PUBLISHED',
        minStock: 1,
      };
      return await catalogService.getProducts(modifiedInput);
    }),
  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await catalogService.getProductById(input);
    }),
});
