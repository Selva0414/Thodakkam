import { query, testConnection } from "../config/database";

async function migrate() {
  const connected = await testConnection();
  if (!connected) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  try {
    console.log("Checking for reset_password columns in students table...");
    
    // Add reset_password_token
    await query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS reset_password_token TEXT;
    `);
    console.log("✅ Column 'reset_password_token' ensured.");

    // Add reset_password_expires
    await query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);
    console.log("✅ Column 'reset_password_expires' ensured.");

    console.log("🚀 Migration completed successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

migrate();
