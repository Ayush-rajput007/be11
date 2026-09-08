import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const grounds = await prisma.ground.findMany();
  console.log('Grounds in database:', grounds.length);
  for (const g of grounds) {
    console.log({
      id: g.id,
      name: g.name,
      slug: g.slug,
      city: g.city,
      state: g.state,
      location: g.location,
      isActive: g.isActive,
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
