import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../../shared/database';
import { ProductStatus } from '@prisma/client';

export const adminProductRouter = router({
  getAdminProducts: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      status: z.nativeEnum(ProductStatus).optional(),
    }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = input.status ? { status: input.status } : {};
      
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: input.limit,
          include: { inventory: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);
      
      return { products, total };
    }),

  createProduct: publicProcedure
    .input(z.object({
      sku: z.string(),
      title: z.string(),
      description: z.string().optional(),
      price: z.number(),
      images: z.array(z.string()),
      categoryId: z.string().optional(),
      initialStock: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      return await prisma.product.create({
        data: {
          sku: input.sku,
          title: input.title,
          description: input.description,
          price: input.price,
          images: input.images,
          categoryId: input.categoryId,
          inventory: {
            create: { availableStock: input.initialStock },
          },
        },
      });
    }),

  updateProduct: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      status: z.nativeEnum(ProductStatus).optional(),
      stock: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, stock, ...data } = input;
      return await prisma.product.update({
        where: { id },
        data: {
          ...data,
          inventory: stock !== undefined ? {
            update: { availableStock: stock }
          } : undefined,
        },
      });
    }),

  deleteProduct: publicProcedure
    .input(z.string())
    .mutation(async ({ input: id }) => {
      return await prisma.product.update({
        where: { id },
        data: { status: ProductStatus.ARCHIVED },
      });
    }),
});
