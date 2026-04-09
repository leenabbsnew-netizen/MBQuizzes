import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Default assumptions
  await prisma.assumptionSet.upsert({
    where: { id: 'default' },
    create: { id: 'default', name: 'default', isActive: true },
    update: {},
  });

  // Hosts
  const hosts = ['Ben', 'Curtis', 'Rob', 'Lee', 'Kim'];
  for (const name of hosts) {
    await prisma.host.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log('✅ Seed complete');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
