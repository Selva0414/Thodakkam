import { query } from "../config/database";

async function checkFullSchema() {
  try {
    console.log("Checking applications table columns with defaults...");
    const columns = await query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'applications'
      ORDER BY ordinal_position
    `);
    console.log("Applications Table Columns:");
    console.table(columns);

  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    process.exit();
  }
}

checkFullSchema();
