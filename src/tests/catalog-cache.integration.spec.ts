
import { prisma } from '../shared/database';
import { catalogService } from '../modules/catalog/catalog.service';
import { cacheService } from '../shared/cache.service';

describe('CatalogService Cache Integration', () => {
  beforeEach(async () => {
    // Clear cache
    // We need a way to clear the cache if it's a singleton. 
    // Since we exported a singleton, we might have persistent state.
    // Let's assume we can clear it or just use a new key.
    // For simplicity, let's just use different product IDs.
    // Actually, invalidate works.
  });

  it('should cache product details', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'test-sku-' + Math.random(),
        title: 'Test Product',
        price: 10.0,
      },
    });

    const spy = jest.spyOn(prisma.product, 'findUnique');

    // First call - should hit DB
    await catalogService.getProductById(product.id);
    expect(spy).toHaveBeenCalledTimes(1);

    // Second call - should hit cache
    await catalogService.getProductById(product.id);
    expect(spy).toHaveBeenCalledTimes(1);

    // Invalidate
    await cacheService.invalidate(`product:${product.id}`);

    // Third call - should hit DB again
    await catalogService.getProductById(product.id);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should invalidate cache on update', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'test-sku-update-' + Math.random(),
        title: 'Test Product Update',
        price: 20.0,
      },
    });

    const spy = jest.spyOn(prisma.product, 'findUnique');

    // Cache it
    await catalogService.getProductById(product.id);
    expect(spy).toHaveBeenCalledTimes(1);

    // Update product
    await catalogService.updateProduct(product.id, { title: 'Updated Title' });

    // Should fetch from DB because cache was invalidated
    await catalogService.getProductById(product.id);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
