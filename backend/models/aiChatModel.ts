import { query } from "../config/database";

const createTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      context VARCHAR(255) DEFAULT 'career_coaching',
      user_type VARCHAR(50) DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

const getChatHistory = async (userId: number | string) => {
  return await query("SELECT * FROM ai_chat_history WHERE user_id = $1 ORDER BY created_at ASC", [userId]);
};

const saveChatMessage = async (chatData: any) => {
  const { user_id, user_message, ai_response, context, user_type } = chatData;
  const result = await query(
    `INSERT INTO ai_chat_history (user_id, user_message, ai_response, context, user_type) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user_id, user_message, ai_response, context, user_type]
  );
  return result[0];
};

export { getChatHistory, saveChatMessage, createTable };
