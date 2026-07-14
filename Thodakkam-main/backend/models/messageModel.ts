import { query } from "../config/database";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

let schemaCompatInitialized = false;

const buildAttachmentUrlSql = (tableAlias: string) => `
  CASE
    WHEN ${tableAlias}.attachment_data IS NOT NULL THEN
      '/messages/' || ${tableAlias}.id || '/attachment'
    ELSE ${tableAlias}.file_url
  END
`;

const ensureMessageSchemaCompatibility = async () => {
  if (schemaCompatInitialized) return;

  // Legacy schemas may keep sender/receiver ids as INTEGER while user ids are TEXT (e.g. "s1").
  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'sender_id' AND data_type <> 'text'
      ) THEN
        ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::text;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'receiver_id' AND data_type <> 'text'
      ) THEN
        ALTER TABLE messages ALTER COLUMN receiver_id TYPE TEXT USING receiver_id::text;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'deleted_for' AND udt_name <> '_text'
      ) THEN
        ALTER TABLE messages ALTER COLUMN deleted_for TYPE TEXT[] USING deleted_for::text[];
      END IF;
    END $$;
  `);

  await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for TEXT[] DEFAULT ARRAY[]::TEXT[]`);
  await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_data BYTEA`);
  await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT`);

  await query(`
    CREATE TABLE IF NOT EXISTS startup_profiles (
      startup_id TEXT PRIMARY KEY,
      avatar_url TEXT,
      timezone VARCHAR(120) DEFAULT '(GMT+05:30) India Standard Time',
      bio VARCHAR(320) DEFAULT '',
      theme VARCHAR(12) DEFAULT 'dark',
      notify_new_registrations BOOLEAN DEFAULT true,
      notify_weekly_reports BOOLEAN DEFAULT false,
      notify_investor_activity BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  schemaCompatInitialized = true;
};

const formatTimeIST = (utcTime: any) => {
  return dayjs(utcTime).tz("Asia/Kolkata").format("hh:mm A");
};

/** Create a message (text, file, image, or meet_link) */
const createMessage = async (senderId: any, senderType: string, receiverId: any, receiverType: string, content: string, options: any = {}) => {
  await ensureMessageSchemaCompatibility();
  const {
    message_type = "text",
    file_url = null,
    file_name = null,
    file_size = null,
    reply_to_message_id = null,
    attachment_data = null,
    attachment_mime_type = null,
  } = options;
  const sqlQuery = `
    INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, message, message_type, file_url, file_name, file_size, reply_to_message_id, attachment_data, attachment_mime_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, sender_id, sender_type, receiver_id, receiver_type,
              message as content, message_type,
              CASE
                WHEN attachment_data IS NOT NULL THEN
                  '/messages/' || id || '/attachment'
                ELSE file_url
              END as file_url,
              file_name, file_size,
              is_read, status, delivered_at, seen_at, created_at, is_deleted, deleted_for, reply_to_message_id;
  `;
  const result = await query(sqlQuery, [senderId, senderType, receiverId, receiverType, content, message_type, file_url, file_name, file_size, reply_to_message_id, attachment_data, attachment_mime_type]);
  const message = result[0];
  message.formatted_time = formatTimeIST(message.created_at);
  return message;
};

/** Get conversation between two users */
const getConversation = async (user1Id: any, user1Type: string, user2Id: any, user2Type: string, options: any = {}) => {
  await ensureMessageSchemaCompatibility();
  const limit = Number.isFinite(Number(options.limit)) ? Math.max(1, Math.min(100, Number(options.limit))) : 50;
  const offset = Number.isFinite(Number(options.offset)) ? Math.max(0, Number(options.offset)) : 0;
  const sqlQuery = `
    WITH convo AS (
      SELECT
        m.id, m.sender_id, m.sender_type, m.receiver_id, m.receiver_type,
        m.message as content, m.message_type,
        ${buildAttachmentUrlSql("m")} as file_url, m.file_name, m.file_size,
        m.is_read, m.status, m.delivered_at, m.seen_at, m.created_at, m.is_deleted, m.deleted_for, m.original_message,
        m.is_edited, m.edited_at, m.reply_to_message_id,
        rm.message as reply_to_content, rm.message_type as reply_to_message_type,
        rm.sender_id as reply_to_sender_id, rm.sender_type as reply_to_sender_type,
        rm.file_name as reply_to_file_name
      FROM messages m
      LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
      WHERE (m.sender_id = $1 AND m.sender_type = $2 AND m.receiver_id = $3 AND m.receiver_type = $4)
         OR (m.sender_id = $3 AND m.sender_type = $4 AND m.receiver_id = $1 AND m.receiver_type = $2)
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT $5 OFFSET $6
    )
    SELECT *
    FROM convo
    ORDER BY created_at ASC, id ASC;
  `;
  const messages = await query(sqlQuery, [user1Id, user1Type, user2Id, user2Type, limit, offset]);
  return messages
    .filter((message: any) => !message.deleted_for || !message.deleted_for.includes(String(user1Id)))
    .map((message: any) => ({
      ...message,
      content: message.is_deleted ? "This message was unsent" : message.content,
      status: message.status || (message.is_read ? "seen" : "sent"),
      formatted_time: formatTimeIST(message.created_at),
    }));
};

/** Get all conversations for a user (sidebar list) */
const getConversations = async (userId: any, userType: string) => {
  await ensureMessageSchemaCompatibility();
  const sqlQuery = `
    WITH participants AS (
      SELECT DISTINCT
        CASE WHEN sender_id = $1::text AND sender_type = $2 THEN receiver_id ELSE sender_id END as other_user_id,
        CASE WHEN sender_id = $1::text AND sender_type = $2 THEN COALESCE(receiver_type, 'student') ELSE COALESCE(sender_type, 'student') END as other_user_type
      FROM messages
      WHERE ((sender_id = $1::text AND sender_type = $2) OR (receiver_id = $1::text AND receiver_type = $2))
        AND is_deleted != TRUE
    ),
    latest_visible_messages AS (
      SELECT DISTINCT ON (
        CASE
          WHEN sender_id = $1::text AND sender_type = $2 THEN receiver_id || '_' || COALESCE(receiver_type, 'student')
          ELSE sender_id || '_' || COALESCE(sender_type, 'student')
        END
      )
        CASE WHEN sender_id = $1::text AND sender_type = $2 THEN receiver_id ELSE sender_id END as other_user_id,
        CASE WHEN sender_id = $1::text AND sender_type = $2 THEN COALESCE(receiver_type, 'student') ELSE COALESCE(sender_type, 'student') END as other_user_type,
        sender_id as last_message_sender_id,
        message,
        message_type,
        status as last_message_status,
        created_at
      FROM messages
      WHERE ((sender_id = $1::text AND sender_type = $2) OR (receiver_id = $1::text AND receiver_type = $2))
        AND is_deleted != TRUE
        AND NOT ($1::text = ANY(COALESCE(deleted_for, ARRAY[]::TEXT[])))
      ORDER BY
        CASE
          WHEN sender_id = $1::text AND sender_type = $2 THEN receiver_id || '_' || COALESCE(receiver_type, 'student')
          ELSE sender_id || '_' || COALESCE(sender_type, 'student')
        END,
        created_at DESC
    ),
    startup_profile_single AS (
      SELECT sp.startup_id::text AS startup_id, sp.avatar_url
      FROM startup_profiles sp
    )
    SELECT
      p.other_user_id,
      p.other_user_type,
      m.last_message_sender_id,
      COALESCE(m.message, 'No messages yet') as last_message,
      COALESCE(m.message_type, 'text') as last_message_type,
      m.last_message_status,
      m.created_at as last_message_time,
      COALESCE(s.name, st.company_name, ma.admin_name, 'Unknown') as other_user_name,
      COALESCE(s.username, st.email, ma.email, '') as other_user_username,
      COALESCE(
        s.profile_photo,
        sp.avatar_url,
        st.logo_url,
        ma.avatar_url,
        'https://ui-avatars.com/api/?name=' || COALESCE(s.name, st.company_name, ma.admin_name, 'U') || '&background=random'
      ) as other_user_avatar,
      COUNT(CASE WHEN msg.is_read = FALSE AND msg.receiver_id = $1::text AND msg.receiver_type = $2 THEN 1 END) as unread_count
    FROM participants p
    LEFT JOIN latest_visible_messages m
      ON m.other_user_id = p.other_user_id
     AND m.other_user_type = p.other_user_type
    LEFT JOIN students s ON s.id::text = p.other_user_id AND p.other_user_type = 'student'
    LEFT JOIN startups st ON st.id::text = p.other_user_id AND p.other_user_type = 'startup'
    LEFT JOIN startup_profile_single sp ON sp.startup_id = p.other_user_id AND p.other_user_type = 'startup'
    LEFT JOIN master_admins ma ON ma.id::text = p.other_user_id AND p.other_user_type = 'admin'
    LEFT JOIN messages msg ON (
      (msg.sender_id = p.other_user_id AND msg.sender_type = p.other_user_type AND msg.receiver_id = $1::text AND msg.receiver_type = $2) OR
      (msg.sender_id = $1::text AND msg.sender_type = $2 AND msg.receiver_id = p.other_user_id AND msg.receiver_type = p.other_user_type)
    ) AND msg.is_deleted != TRUE
      AND NOT ($1::text = ANY(COALESCE(msg.deleted_for, ARRAY[]::TEXT[])))
    GROUP BY p.other_user_id, p.other_user_type, m.last_message_sender_id, m.message, m.message_type, m.last_message_status, m.created_at, s.name, s.username, s.profile_photo, st.company_name, st.email, st.logo_url, sp.avatar_url, ma.admin_name, ma.email, ma.avatar_url
    ORDER BY m.created_at DESC NULLS LAST, p.other_user_id DESC;
  `;
  const conversations = await query(sqlQuery, [userId, userType]);
  return conversations.map((conv: any) => ({
    ...conv,
    last_message_status: conv.last_message_status || (conv.unread_count === 0 ? "seen" : "sent"),
    formatted_last_message_time: conv.last_message_time ? formatTimeIST(conv.last_message_time) : null,
  }));
};

/** Mark messages as read */
const markAsRead = async (senderId: any, senderType: string, receiverId: any, receiverType: string) => {
  const sqlQuery = `
    UPDATE messages
    SET is_read = TRUE,
        status = 'seen',
        seen_at = NOW()
    WHERE sender_id = $1 AND sender_type = $2 AND receiver_id = $3 AND receiver_type = $4 AND (is_read = FALSE OR status != 'seen');
  `;
  await query(sqlQuery, [senderId, senderType, receiverId, receiverType]);
};

/** Mark a single message as delivered */
const markMessageDelivered = async (messageId: any, receiverId: any, receiverType: string) => {
  const sqlQuery = `
    UPDATE messages
    SET status = 'delivered',
        delivered_at = NOW()
    WHERE id = $1
      AND receiver_id = $2
      AND receiver_type = $3
      AND status = 'sent'
    RETURNING id, sender_id, sender_type, receiver_id, receiver_type, status, delivered_at;
  `;
  const result = await query(sqlQuery, [messageId, receiverId, receiverType]);
  return result[0] || null;
};

/** Bulk mark all unread messages in a conversation as seen for a viewer */
const markConversationSeen = async (viewerId: any, viewerType: string, otherUserId: any, otherUserType: string) => {
  const sqlQuery = `
    UPDATE messages
    SET is_read = TRUE,
        status = 'seen',
        seen_at = NOW()
    WHERE sender_id = $1
      AND sender_type = $2
      AND receiver_id = $3
      AND receiver_type = $4
      AND status != 'seen'
    RETURNING id, sender_id, sender_type, receiver_id, receiver_type, status, seen_at;
  `;
  return await query(sqlQuery, [otherUserId, otherUserType, viewerId, viewerType]);
};

/** Unsend a message (sender only) */
const unsendMessage = async (messageId: any, userId: any, userType: string) => {
  const checkQuery = `
    SELECT id, sender_id, sender_type, message, is_deleted
    FROM messages
    WHERE id = $1 AND sender_id = $2 AND sender_type = $3;
  `;
  const message = await query(checkQuery, [messageId, userId, userType]);
  if (message.length === 0) throw new Error("Message not found or you are not authorized to unsend this message");
  if (message[0].is_deleted) throw new Error("Message has already been unsent");

  const updateQuery = `
    UPDATE messages
    SET is_deleted = TRUE,
        original_message = message,
        message = 'This message was unsent'
    WHERE id = $1
    RETURNING id, sender_id, sender_type, receiver_id, receiver_type;
  `;
  const result = await query(updateQuery, [messageId]);
  return result[0];
};

/** Delete message for current user only */
const deleteMessageForMe = async (messageId: any, userId: any) => {
  await ensureMessageSchemaCompatibility();
  const updateQuery = `
    UPDATE messages
    SET deleted_for = ARRAY_APPEND(COALESCE(deleted_for, ARRAY[]::TEXT[]), $2::text)
    WHERE id = $1 AND NOT ($2::text = ANY(COALESCE(deleted_for, ARRAY[]::TEXT[])))
    RETURNING id, deleted_for;
  `;
  const result = await query(updateQuery, [messageId, userId]);
  if (result.length === 0) throw new Error("Message not found or already deleted");
  return result[0];
};

/** Delete entire conversation for current user only */
const deleteConversationForMe = async (userId: any, userType: string, otherUserId: any, otherUserType: string) => {
  await ensureMessageSchemaCompatibility();
  const updateQuery = `
    UPDATE messages
    SET deleted_for = ARRAY_APPEND(COALESCE(deleted_for, ARRAY[]::TEXT[]), $1::text)
    WHERE (
      (sender_id = $1 AND sender_type = $2 AND receiver_id = $3 AND receiver_type = $4) OR
      (sender_id = $3 AND sender_type = $4 AND receiver_id = $1 AND receiver_type = $2)
    ) AND NOT ($1::text = ANY(COALESCE(deleted_for, ARRAY[]::TEXT[])));
  `;
  await query(updateQuery, [userId, userType, otherUserId, otherUserType]);
  return true;
};

/** Edit a message (sender only) */
const editMessage = async (messageId: any, userId: any, content: string) => {
  const checkQuery = `SELECT id, sender_id, is_deleted FROM messages WHERE id = $1 AND sender_id = $2;`;
  const message = await query(checkQuery, [messageId, userId]);
  if (message.length === 0) throw new Error("Message not found or you are not authorized to edit this message");
  if (message[0].is_deleted) throw new Error("Cannot edit an unsent message");

  const updateQuery = `
    UPDATE messages
    SET original_message = CASE WHEN is_edited = FALSE THEN message ELSE original_message END,
        message = $2,
        is_edited = TRUE,
        edited_at = NOW()
    WHERE id = $1
    RETURNING id, sender_id, sender_type, receiver_id, receiver_type, message as content, is_edited, edited_at;
  `;
  const result = await query(updateQuery, [messageId, content]);
  return result[0];
};

/** Get a specific message by ID for reply functionality */
const getMessageById = async (messageId: any) => {
  const sqlQuery = `
    SELECT id, sender_id, sender_type, receiver_id, receiver_type,
           message as content, message_type,
           ${buildAttachmentUrlSql("messages")} as file_url, file_name, file_size,
           created_at, is_deleted
    FROM messages
    WHERE id = $1 AND is_deleted != TRUE;
  `;
  const result = await query(sqlQuery, [messageId]);
  return result[0] || null;
};

export {
  createMessage,
  getConversation,
  getConversations,
  markAsRead,
  markMessageDelivered,
  markConversationSeen,
  unsendMessage,
  deleteMessageForMe,
  deleteConversationForMe,
  editMessage,
  getMessageById,
};
