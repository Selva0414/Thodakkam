const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://neondb_owner:npg_hRb3FlYu0qkS@ep-empty-sun-atlukk2w-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function pushSchema() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Neon DB');

    const schemaPath = path.join(__dirname, 'full_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split statements or run all at once. pg client.query can run multiple statements separated by semicolons.
    console.log('Executing schema...');
    await client.query(sql);
    console.log('Schema pushed successfully!');
    
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await client.end();
  }
}

pushSchema();
