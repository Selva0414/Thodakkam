/**
 * Data Migration Script: Populate conversations table from existing messages
 *
 * This script:
 * 1. Finds all unique conversation pairs from messages table
 * 2. Creates conversation records with metadata
 * 3. Updates messages with conversation_id
 * 4. Calculates unread counts for each user
 */

require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateConversations() {
  const client = await pool.connect();

  try {
    console.log('Starting conversation migration...');

    // Begin transaction
    await client.query('BEGIN');

    // Find all unique conversation pairs
    const conversationsQuery = `
      SELECT DISTINCT
        LEAST(sender_id, receiver_id) as user1_id,
        CASE
          WHEN sender_id < receiver_id THEN sender_type
          WHEN sender_id = receiver_id THEN LEAST(sender_type, receiver_type)
          ELSE receiver_type
        END as user1_type,
        GREATEST(sender_id, receiver_id) as user2_id,
        CASE
          WHEN sender_id > receiver_id THEN sender_type
          WHEN sender_id = receiver_id THEN GREATEST(sender_type, receiver_type)
          ELSE receiver_type
        END as user2_type
      FROM messages
      WHERE sender_id != receiver_id OR sender_type != receiver_type
      ORDER BY user1_id, user1_type, user2_id, user2_type;
    `;

    const { rows: conversationPairs } = await client.query(conversationsQuery);
    console.log(`Found ${conversationPairs.length} unique conversations`);

    let conversationsCreated = 0;
    let messagesUpdated = 0;

    // Process each conversation
    for (const pair of conversationPairs) {
      const { user1_id, user1_type, user2_id, user2_type } = pair;

      // Get last message for this conversation
      const lastMessageQuery = `
        SELECT id, message, created_at
        FROM messages
        WHERE (
          (sender_id = $1 AND sender_type = $2 AND receiver_id = $3 AND receiver_type = $4)
          OR
          (sender_id = $3 AND sender_type = $4 AND receiver_id = $1 AND receiver_type = $2)
        )
        ORDER BY created_at DESC
        LIMIT 1;
      `;

      const { rows: lastMsgRows } = await client.query(lastMessageQuery, [
        user1_id, user1_type, user2_id, user2_type
      ]);

      if (lastMsgRows.length === 0) continue;

      const lastMessage = lastMsgRows[0];
      const lastMessagePreview = lastMessage.message ?
        lastMessage.message.substring(0, 100) :
        '[File or media]';

      // Calculate unread counts for each user
      const unreadUser1Query = `
        SELECT COUNT(*) as count
        FROM messages
        WHERE sender_id = $1 AND sender_type = $2
          AND receiver_id = $3 AND receiver_type = $4
          AND is_read = FALSE;
      `;

      const unreadUser2Query = `
        SELECT COUNT(*) as count
        FROM messages
        WHERE sender_id = $1 AND sender_type = $2
          AND receiver_id = $3 AND receiver_type = $4
          AND is_read = FALSE;
      `;

      const { rows: unreadUser1 } = await client.query(unreadUser1Query, [
        user2_id, user2_type, user1_id, user1_type
      ]);

      const { rows: unreadUser2 } = await client.query(unreadUser2Query, [
        user1_id, user1_type, user2_id, user2_type
      ]);

      const unreadCountUser1 = parseInt(unreadUser1[0].count) || 0;
      const unreadCountUser2 = parseInt(unreadUser2[0].count) || 0;

      // Create conversation record
      const createConvQuery = `
        INSERT INTO conversations (
          user1_id, user1_type, user2_id, user2_type,
          last_message_id, last_message_preview, last_message_time,
          unread_count_user1, unread_count_user2,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
        ON CONFLICT (user1_id, user1_type, user2_id, user2_type) DO NOTHING
        RETURNING id;
      `;

      const { rows: convRows } = await client.query(createConvQuery, [
        user1_id, user1_type, user2_id, user2_type,
        lastMessage.id, lastMessagePreview, lastMessage.created_at,
        unreadCountUser1, unreadCountUser2,
        lastMessage.created_at
      ]);

      if (convRows.length === 0) {
        console.log(`Conversation already exists for ${user1_id}(${user1_type}) <-> ${user2_id}(${user2_type})`);
        continue;
      }

      const conversationId = convRows[0].id;
      conversationsCreated++;

      // Update all messages with conversation_id
      const updateMessagesQuery = `
        UPDATE messages
        SET conversation_id = $1
        WHERE (
          (sender_id = $2 AND sender_type = $3 AND receiver_id = $4 AND receiver_type = $5)
          OR
          (sender_id = $4 AND sender_type = $5 AND receiver_id = $2 AND receiver_type = $3)
        );
      `;

      const updateResult = await client.query(updateMessagesQuery, [
        conversationId, user1_id, user1_type, user2_id, user2_type
      ]);

      messagesUpdated += updateResult.rowCount;

      if (conversationsCreated % 10 === 0) {
        console.log(`Progress: ${conversationsCreated} conversations created, ${messagesUpdated} messages updated`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Migration completed successfully!');
    console.log(`Total conversations created: ${conversationsCreated}`);
    console.log(`Total messages updated: ${messagesUpdated}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateConversations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
