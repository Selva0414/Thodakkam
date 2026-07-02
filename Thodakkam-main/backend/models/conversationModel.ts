/**
 * Conversation Model
 *
 * Manages conversations between users with metadata and unread counts.
 * Each conversation links two users (ordered to prevent duplicates).
 */
import { pool } from "../config/database";

const conversationModel = {
  /** Find or create a conversation between two users */
  async findOrCreate(userId1: number, userType1: string, userId2: number, userType2: string) {
    let user1_id: number, user1_type: string, user2_id: number, user2_type: string;

    if (userId1 < userId2) {
      user1_id = userId1; user1_type = userType1; user2_id = userId2; user2_type = userType2;
    } else if (userId1 > userId2) {
      user1_id = userId2; user1_type = userType2; user2_id = userId1; user2_type = userType1;
    } else {
      if (userType1 < userType2) {
        user1_id = userId1; user1_type = userType1; user2_id = userId2; user2_type = userType2;
      } else {
        user1_id = userId2; user1_type = userType2; user2_id = userId1; user2_type = userType1;
      }
    }

    const q = `
      INSERT INTO conversations (user1_id, user1_type, user2_id, user2_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user1_id, user1_type, user2_id, user2_type)
      DO UPDATE SET updated_at = NOW()
      RETURNING *;
    `;

    const result = await pool.query(q, [user1_id, user1_type, user2_id, user2_type]);
    return result.rows[0];
  },

  /** Get all conversations for a user */
  async getByUserId(userId: number | string, userType: string) {
    const q = `
      SELECT
        c.*,
        CASE
          WHEN c.user1_id = $1 AND c.user1_type = $2 THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        CASE
          WHEN c.user1_id = $1 AND c.user1_type = $2 THEN c.user2_type
          ELSE c.user1_type
        END as other_user_type,
        CASE
          WHEN c.user1_id = $1 AND c.user1_type = $2 THEN c.unread_count_user1
          ELSE c.unread_count_user2
        END as unread_count
      FROM conversations c
      WHERE (c.user1_id = $1 AND c.user1_type = $2)
         OR (c.user2_id = $1 AND c.user2_type = $2)
      ORDER BY c.last_message_time DESC NULLS LAST, c.updated_at DESC;
    `;
    const result = await pool.query(q, [userId, userType]);
    return result.rows;
  },

  /** Update conversation metadata after sending a message */
  async updateLastMessage(conversationId: number | string, messageId: number | string, preview: string, timestamp: any) {
    const q = `
      UPDATE conversations
      SET
        last_message_id = $2,
        last_message_preview = $3,
        last_message_time = $4,
        updated_at = NOW()
      WHERE id = $1;
    `;
    const messagePreview = preview ? preview.substring(0, 100) : "[File or media]";
    await pool.query(q, [conversationId, messageId, messagePreview, timestamp]);
  },

  /** Increment unread count for a user in a conversation */
  async incrementUnread(conversationId: number | string, forUserId: number | string, forUserType: string) {
    const positionQuery = `
      SELECT
        CASE
          WHEN user1_id = $2 AND user1_type = $3 THEN 1
          WHEN user2_id = $2 AND user2_type = $3 THEN 2
          ELSE 0
        END as position
      FROM conversations
      WHERE id = $1;
    `;
    const { rows: posRows } = await pool.query(positionQuery, [conversationId, forUserId, forUserType]);

    if (posRows.length === 0 || posRows[0].position === 0) {
      console.error(`User ${forUserId}(${forUserType}) not found in conversation ${conversationId}`);
      return;
    }

    const position = posRows[0].position;
    const columnName = position === 1 ? "unread_count_user1" : "unread_count_user2";
    const updateQuery = `
      UPDATE conversations
      SET ${columnName} = ${columnName} + 1
      WHERE id = $1
      RETURNING ${columnName} as new_count;
    `;
    const result = await pool.query(updateQuery, [conversationId]);
    return result.rows[0]?.new_count || 0;
  },

  /** Reset unread count for a user in a conversation */
  async resetUnread(conversationId: number | string, forUserId: number | string, forUserType: string) {
    const positionQuery = `
      SELECT
        CASE
          WHEN user1_id = $2 AND user1_type = $3 THEN 1
          WHEN user2_id = $2 AND user2_type = $3 THEN 2
          ELSE 0
        END as position
      FROM conversations
      WHERE id = $1;
    `;
    const { rows: posRows } = await pool.query(positionQuery, [conversationId, forUserId, forUserType]);

    if (posRows.length === 0 || posRows[0].position === 0) return;

    const position = posRows[0].position;
    const columnName = position === 1 ? "unread_count_user1" : "unread_count_user2";
    const updateQuery = `UPDATE conversations SET ${columnName} = 0 WHERE id = $1;`;
    await pool.query(updateQuery, [conversationId]);
  },

  /** Get a specific conversation by ID */
  async getById(conversationId: number | string) {
    const result = await pool.query("SELECT * FROM conversations WHERE id = $1;", [conversationId]);
    return result.rows[0] || null;
  },

  /** Delete a conversation and all its messages */
  async delete(conversationId: number | string) {
    await pool.query("DELETE FROM conversations WHERE id = $1;", [conversationId]);
  },

  /** Get conversation between two specific users */
  async getBetweenUsers(userId1: number, userType1: string, userId2: number, userType2: string) {
    let user1_id: number, user1_type: string, user2_id: number, user2_type: string;

    if (userId1 < userId2) {
      user1_id = userId1; user1_type = userType1; user2_id = userId2; user2_type = userType2;
    } else if (userId1 > userId2) {
      user1_id = userId2; user1_type = userType2; user2_id = userId1; user2_type = userType1;
    } else {
      if (userType1 < userType2) {
        user1_id = userId1; user1_type = userType1; user2_id = userId2; user2_type = userType2;
      } else {
        user1_id = userId2; user1_type = userType2; user2_id = userId1; user2_type = userType1;
      }
    }

    const q = `
      SELECT * FROM conversations
      WHERE user1_id = $1 AND user1_type = $2
        AND user2_id = $3 AND user2_type = $4;
    `;
    const result = await pool.query(q, [user1_id, user1_type, user2_id, user2_type]);
    return result.rows[0] || null;
  },
};

export default conversationModel;
