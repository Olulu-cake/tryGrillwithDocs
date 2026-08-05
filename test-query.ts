import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = '9ca4e415-0201-4f90-8fe9-ecea25c50196';
  const product = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true }
  });
  console.log('Product data:', JSON.stringify(product, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
