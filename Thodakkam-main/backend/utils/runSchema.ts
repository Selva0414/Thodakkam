import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const pool = new Pool({ 
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function runSchema() {
  const schemaFiles = [
    "001_startup_tables.sql",
    "002_alter_startups.sql",
    "003_drop_name_column.sql",
    "004_add_startup_status.sql",
  ];

  for (const file of schemaFiles) {
    const sqlPath = path.join(__dirname, "../../database/schemas", file);
    if (!fs.existsSync(sqlPath)) {
      console.log(`Skipping missing file: ${file}`);
      continue;
    }
    const sqlText = fs.readFileSync(sqlPath, "utf-8");

    const cleaned = sqlText
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");

    const statements = cleaned
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`\nRunning ${file}...`);
    try {
      for (const stmt of statements) {
        console.log("  >", stmt.substring(0, 70) + "...");
        await pool.query(stmt);
      }
      console.log(`  Done: ${file}`);
    } catch (err: any) {
      console.error(`  Error in ${file}:`, err.message);
    }
  }

  console.log("\nAll schemas processed.");
  process.exit(0);
}

runSchema();
