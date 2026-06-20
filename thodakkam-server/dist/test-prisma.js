"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
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
    }
    catch (e) {
        console.error("ERROR:", e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
