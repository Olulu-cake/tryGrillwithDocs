import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring all products have inventory...');
  
  const products = await prisma.product.findMany({
    include: { inventory: true },
  });

  for (const product of products) {
    if (!product.inventory) {
      console.log(`Fixing inventory for product: ${product.title} (ID: ${product.id})`);
      await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          availableStock: 50,
        },
      });
    }
  }
  console.log('Inventory fix completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
