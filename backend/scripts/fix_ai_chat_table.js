/**
 * Fix AI Chat History Table
 * 
 * Problem: The ai_chat_history table was created with user_id as UUID type,
 * but the students table uses INTEGER (SERIAL) for id.
 * This causes "invalid input syntax for type uuid" errors.
 * 
 * Fix: Drop and recreate the table with user_id as INTEGER.
 * 
 * Run: node scripts/fix_ai_chat_table.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (process.env.NODE_ENV === 'development' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const { pool } = require('../config/database');

async function fix() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🔍 Checking current ai_chat_history table schema...');
    const colCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_chat_history' AND column_name = 'user_id'
    `);

    if (colCheck.rows.length > 0) {
      console.log(`   Current user_id type: ${colCheck.rows[0].data_type}`);
      
      if (colCheck.rows[0].data_type === 'uuid') {
        console.log('⚠️  user_id is UUID — needs to be changed to INTEGER');
        console.log('📝 Dropping and recreating ai_chat_history table...');
        
        await client.query('DROP TABLE IF EXISTS ai_chat_history');
        
        await client.query(`
          CREATE TABLE ai_chat_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            context VARCHAR(255) DEFAULT 'career_coaching',
            user_type VARCHAR(50) DEFAULT 'student',
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        
        console.log('   ✅ Table recreated with user_id as INTEGER');
      } else {
        console.log('   ✅ user_id is already the correct type — no changes needed');
      }
    } else {
      console.log('   Table does not exist yet — it will be created automatically');
    }

    await client.query('COMMIT');
    console.log('\n🎉 Fix completed successfully!\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fix failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fix().catch(() => process.exit(1));
