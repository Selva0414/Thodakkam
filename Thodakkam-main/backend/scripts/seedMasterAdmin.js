#!/usr/bin/env node
require('dotenv').config();
require('ts-node/register/transpile-only');

const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/database.ts');

async function seedMasterAdmin() {
  const adminName = process.env.MASTER_ADMIN_NAME || 'Master Admin';
  const email = process.env.MASTER_ADMIN_EMAIL || 'admin@startup.local';
  const password = process.env.MASTER_ADMIN_PASSWORD || 'Admin@12345';

  try {
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'master_admins'
      ) AS exists`
    );

    if (!tableCheck[0]?.exists) {
      console.error('master_admins table not found. Run migrations/schema setup first.');
      process.exitCode = 1;
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const rows = await query(
      `INSERT INTO master_admins (admin_name, email, password_hash, is_verified)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email)
       DO UPDATE SET
         admin_name = EXCLUDED.admin_name,
         password_hash = EXCLUDED.password_hash,
         is_verified = true
       RETURNING id, admin_name, email, is_verified`,
      [adminName, email, passwordHash]
    );

    const admin = rows[0];
    console.log('Master admin seeded successfully.');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${password}`);
    console.log('Use these credentials on /master-admin/login');
  } catch (error) {
    console.error('Failed to seed master admin:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedMasterAdmin();
