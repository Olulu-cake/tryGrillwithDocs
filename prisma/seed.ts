import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding products...');

  const products = [
    { sku: 'PROD-001', title: '經典黑咖啡', price: 150.00, stock: 100, description: '選用中深烘焙咖啡豆，口感濃郁滑順' },
    { sku: 'PROD-002', title: '拿鐵咖啡', price: 180.00, stock: 80, description: '綿密奶泡搭配醇厚濃縮咖啡，經典美味' },
    { sku: 'PROD-003', title: '精選濾掛咖啡包', price: 350.00, stock: 200, description: '隨身享受精品級咖啡，輕鬆沖泡' },
    { sku: 'PROD-004', title: '手工陶瓷咖啡杯', price: 590.00, stock: 50, description: '溫潤質感，提升咖啡品飲體驗' },
    { sku: 'PROD-005', title: '不鏽鋼濾網', price: 250.00, stock: 150, description: '耐用環保，手沖咖啡的絕佳配件' }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { 
        title: p.title,
        price: p.price,
        description: p.description,
        inventory: {
            upsert: {
                update: { availableStock: p.stock },
                create: { availableStock: p.stock }
            }
        }
      },
      create: {
        sku: p.sku,
        title: p.title,
        price: p.price,
        description: p.description,
        inventory: { create: { availableStock: p.stock } }
      },
    });
    console.log(`Created/Ensured product: ${p.title}`);
  }
  console.log('Seeding finished.');
}
// ...

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
