import { pool } from "../config/database";

async function unlockStartups() {
  try {
    console.log("Unlocking all startups in the database...");
    
    // Set them to paid and extend their plan by 10 years
    const result = await pool.query(`
      UPDATE startups 
      SET is_locked = false, 
          locked_at = NULL, 
          plan_type = 'paid',
          plan_expires_at = NOW() + INTERVAL '10 years'
    `);
    
    console.log(`✅ Successfully unlocked ${result.rowCount} startups!`);
    console.log("You can now access all startup portal pages without the 403 Forbidden errors.");
  } catch (err: any) {
    console.error("❌ Failed to unlock startups:", err.message);
  } finally {
    pool.end();
  }
}

unlockStartups();
