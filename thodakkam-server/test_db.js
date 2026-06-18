const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const start = Date.now();
    const existing = await prisma.startup.findFirst();
    console.log('DB Connection successful:', existing !== undefined, 'Took', Date.now() - start, 'ms');
  } catch(e) {
    console.error('DB Connection Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
