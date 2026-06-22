require('ts-node/register/transpile-only');
const { query } = require('../config/database.ts');

(async () => {
  try {
    const rows = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'messages'
      ORDER BY column_name;
    `);

    const have = new Set(rows.map(r => r.column_name));
    const required = [
      'message_type',
      'reply_to_message_id',
      'file_url',
      'file_name',
      'file_size',
      'attachment_data',
      'attachment_mime_type',
      'is_edited',
      'edited_at',
      'is_deleted',
      'deleted_for',
      'original_message'
    ];

    const missing = required.filter(c => !have.has(c));
    console.log(`messages_columns_total=${rows.length}`);
    console.log(`missing_required=${missing.length ? missing.join(',') : 'none'}`);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
