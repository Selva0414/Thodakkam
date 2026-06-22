import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function sql(strings: TemplateStringsArray, ...values: any[]) {
  let text = "";
  strings.forEach((s, i) => { text += s; if (i < values.length) text += `$${i + 1}`; });
  const result = await pool.query(text, values);
  return result.rows;
}

async function check() {
  console.log("🔍 Checking Database State...");

  const students = await sql`SELECT id, name FROM students ORDER BY id LIMIT 20`;
  console.log("\nStudents:", students);

  const apps = await sql`SELECT student_id, COUNT(*) FROM applications GROUP BY student_id`;
  console.log("\nApplications per student_id:", apps);
  
  if (students.length > 0) {
    const studentApps = await sql`SELECT * FROM applications WHERE student_id::text = ${String(students[0].id)} LIMIT 5`;
    console.log(`\nApplications for first student (${students[0].name}):`, studentApps.length);
  }
}

check().catch(console.error);
