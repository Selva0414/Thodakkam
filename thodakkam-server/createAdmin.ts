import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@thodakkam.com' },
    update: {},
    create: {
      email: 'admin@thodakkam.com',
      password: 'password123',
      role: 'master',
    },
  });

  console.log('Sample admin created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
