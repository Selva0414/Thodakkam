import { query } from "./database";

async function checkSchema(): Promise<void> {
  try {
    const tables = ["students"];
    for (const table of tables) {
      const cols = await query(
        `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `,
        [table]
      );
      console.log(`Columns for ${table}:`, cols);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkSchema();
