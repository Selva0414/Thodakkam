const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.create({
    data: {
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
