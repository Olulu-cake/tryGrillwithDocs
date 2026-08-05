import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CatalogService {
  async getProducts(params: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }) {
    const { search, category, minPrice, maxPrice, sortBy } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Note: Assuming 'category' might be a field in Product in future, 
    // or need a relational model. For now, skipping category filtering 
    // as it's not in the current Product model.

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const orderBy: any = {};
    if (sortBy === 'price_asc') orderBy.price = 'asc';
    else if (sortBy === 'price_desc') orderBy.price = 'desc';
    else if (sortBy === 'newest') orderBy.createdAt = 'desc';
    else orderBy.createdAt = 'desc'; // Default

    return await prisma.product.findMany({
      where,
      orderBy,
      include: {
        inventory: true,
      },
    });
  }

  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
      },
    });
  }

  async createProduct(data: any) {
    return await prisma.product.create({ data });
  }

  async updateProduct(id: string, data: any) {
    return await prisma.product.update({ where: { id }, data });
  }
}

export const catalogService = new CatalogService();