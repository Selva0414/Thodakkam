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
  try {
    const companyName = "ABC";
    const text = "test";
    const imageUrl = null;
    const generatedEmail = `${companyName.replace(/\s+/g, '').toLowerCase()}@startup.local`;
    let startupUser = await prisma.student.findFirst({ where: { email: generatedEmail } });
    if (!startupUser) {
      startupUser = await prisma.student.create({
        data: {
          fullName: companyName,
          email: generatedEmail,
          password: 'mockpassword',
          skills: []
        }
      });
    }
    const post = await prisma.post.create({
      data: {
        text,
        imageUrl,
        category: 'Projects',
        userId: startupUser.id
      }
    });
    console.log("SUCCESS:", post);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
