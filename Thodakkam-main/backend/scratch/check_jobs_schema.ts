import { query } from "../config/database";

async function checkSchema() {
  const result = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'jobs'
  `);
  console.log(JSON.stringify(result, null, 2));
}

checkSchema().catch(console.error);
