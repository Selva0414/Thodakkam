const { query } = require('../config/database');

async function main() {
  try {
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    console.log("Students columns:", columns);

    const applications = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications'
    `);
    console.log("Applications columns:", applications);
  } catch (err) {
    console.error("Error inspecting schema:", err);
  }
}

main().then(() => process.exit(0));
