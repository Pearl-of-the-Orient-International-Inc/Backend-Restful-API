import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { chaplainProductSeeds } from './chaplain-product-seed-data';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const product of chaplainProductSeeds) {
    await prisma.chaplainProduct.upsert({
      where: { slug: product.slug },
      create: product,
      update: {
        name: product.name,
        category: product.category,
        price: product.price,
        imageUrl: product.imageUrl,
        imageFileName: product.imageFileName,
        sortOrder: product.sortOrder,
      },
    });
  }

  console.log(`Seeded ${chaplainProductSeeds.length} chaplain products.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Chaplain product seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
