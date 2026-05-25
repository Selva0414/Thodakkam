import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@thodakkam.edu';
  const password = 'AdminPassword123';

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  
  if (existingAdmin) {
    console.log(`Admin ${email} already exists!`);
  } else {
    // Create admin
    const newAdmin = await prisma.admin.create({
      data: {
        email: email,
        password: password,
        role: 'Master Admin'
      }
    });
    console.log(`Created new admin: ${newAdmin.email} with password: ${password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
