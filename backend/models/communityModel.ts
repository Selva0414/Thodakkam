import { query } from "../config/database";

let schemaReady = false; // reset on each server start

const ensureSchema = async () => {
  if (schemaReady) return;

  // Patch posts columns individually — each in its own try/catch so one failure doesn't block all
  const postColPatches = [
    `ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey`,
    `ALTER TABLE posts ALTER COLUMN author_id TYPE TEXT USING author_id::text`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name TEXT`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_role TEXT`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'student'`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[]`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_name TEXT`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_of INTEGER`,
    `ALTER TABLE post_likes ALTER COLUMN user_id TYPE TEXT USING user_id::text`,
    `ALTER TABLE post_comments ALTER COLUMN author_id TYPE TEXT USING author_id::text`,
    `ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS author_name TEXT`,
    `ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS author_avatar TEXT`,
    `ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'student'`,
  ];

  for (const sql of postColPatches) {
    try { await query(sql); } catch { /* column already exists — safe to ignore */ }
  }

  // Create dependent tables — each individually guarded
  const tableCreates = [
    `CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (post_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS post_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL,
      author_name TEXT,
      author_avatar TEXT,
      author_type TEXT DEFAULT 'student',
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS post_shares (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      user_type VARCHAR(20) NOT NULL DEFAULT 'student',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS community_follows (
      id SERIAL PRIMARY KEY,
      follower_id TEXT NOT NULL,
      follower_type VARCHAR(20) NOT NULL,
      followed_id TEXT NOT NULL,
      followed_type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (follower_id, follower_type, followed_id, followed_type)
    )`,
    `CREATE TABLE IF NOT EXISTS post_saves (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      user_type TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(post_id, user_id, user_type)
    )`,
  ];

  for (const sql of tableCreates) {
    try { await query(sql); } catch (e: any) { console.warn('[Community] table create skipped:', e.message); }
  }

  // Clean up duplicate post_shares rows (safe to fail)
  try {
    await query(`
      DELETE FROM post_shares a USING post_shares b
      WHERE a.id > b.id
        AND a.post_id = b.post_id
        AND a.user_id = b.user_id
        AND a.user_type = b.user_type
    `);
  } catch { /* safe to skip */ }

  // Create indexes — each individually guarded
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_community_follows_follower ON community_follows(follower_id, follower_type)`,
    `CREATE INDEX IF NOT EXISTS idx_community_follows_followed ON community_follows(followed_id, followed_type)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_post_shares_unique ON post_shares (post_id, user_id, user_type)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`,
  ];

  for (const sql of indexes) {
    try { await query(sql); } catch { /* index may already exist */ }
  }

  schemaReady = true;
};

const POST_LIST_COLS = `
  p.id, p.author_id, p.author_name, p.author_role, p.author_avatar, p.author_type,
  p.content, p.tags, p.likes_count, p.comments_count, p.shares_count,
  p.media_name, p.created_at, p.updated_at, p.repost_of,
  (p.media_url IS NOT NULL AND p.media_url <> '') AS "has_media",
  CASE
    WHEN p.media_url IS NOT NULL AND p.media_url <> '' THEN split_part(split_part(p.media_url, ':', 2), ';', 1)
    ELSE NULL
  END AS "media_type"
`;

const ORIGINAL_POST_COLS = `
  op.id              AS orig_id,
  op.author_id       AS orig_author_id,
  op.author_name     AS orig_author_name,
  op.author_role     AS orig_author_role,
  op.author_avatar   AS orig_author_avatar,
  op.author_type     AS orig_author_type,
  op.content         AS orig_content,
  op.tags            AS orig_tags,
  op.likes_count     AS orig_likes_count,
  op.comments_count  AS orig_comments_count,
  op.shares_count    AS orig_shares_count,
  op.media_name      AS orig_media_name,
  op.created_at      AS orig_created_at,
  (op.media_url IS NOT NULL AND op.media_url <> '') AS "orig_has_media",
  CASE
    WHEN op.media_url IS NOT NULL AND op.media_url <> '' THEN split_part(split_part(op.media_url, ':', 2), ';', 1)
    ELSE NULL
  END AS "orig_media_type"
`;

const getPosts = async (userId: number | string | null = null, userType: string | null = null) => {
  await ensureSchema();

  if (userId) {
    return await query(
      `
      SELECT ${POST_LIST_COLS},
             ${ORIGINAL_POST_COLS},
             EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = COALESCE(p.repost_of, p.id) AND l.user_id = $1::text) as "isLiked",
             EXISTS(SELECT 1 FROM post_shares s WHERE s.post_id = COALESCE(p.repost_of, p.id) AND s.user_id = $1::text AND s.user_type = $2) as "isShared",
             EXISTS(SELECT 1 FROM community_follows f
              WHERE f.follower_id = $1::text AND f.follower_type = $2
                AND f.followed_id = p.author_id AND f.followed_type = p.author_type) as "isFollowing"
      FROM posts p
      LEFT JOIN posts op ON p.repost_of = op.id
      ORDER BY p.created_at DESC
    `,
      [userId, userType || 'student']
    );
  }
  return await query(`SELECT ${POST_LIST_COLS}, ${ORIGINAL_POST_COLS} FROM posts p LEFT JOIN posts op ON p.repost_of = op.id ORDER BY p.created_at DESC`);
};

const createPost = async (postData: any) => {
  await ensureSchema();

  const { author_id, author_name, author_role, author_avatar, content, tags, author_type, media_url, media_name } = postData;
  
  // Normalise tags: must be a JS string[] for pg to bind as TEXT[]
  const tagsArray: string[] = Array.isArray(tags)
    ? tags.map(String)
    : typeof tags === 'string'
      ? [tags]
      : [];

  try {
    const result = await query(
      `INSERT INTO posts (author_id, author_name, author_role, author_avatar, content, tags, author_type, media_url, media_name) 
       VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8, $9) RETURNING *`,
      [author_id, author_name, author_role, author_avatar, content, tagsArray, author_type, media_url || null, media_name || null]
    );
    return result[0];
  } catch (err: any) {
    console.error('[createPost] DB error:', err.message, '| code:', err.code, '| detail:', err.detail);
    throw err;
  }
};

const getPostMedia = async (postId: number | string) => {
  const rows = await query(`SELECT media_url, media_name FROM posts WHERE id = $1 LIMIT 1`, [postId]);
  return rows[0] || null;
};

const likePost = async (postId: number | string, userId: number | string) => {
  await ensureSchema();

  const existing = await query(
    `SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1`,
    [postId, userId]
  );

  if (existing[0]) {
    await query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
    const updated = await query(
      `UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1 RETURNING likes_count`,
      [postId]
    );
    return { likes_count: updated[0]?.likes_count || 0, isLiked: false };
  }

  await query(
    `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [postId, userId]
  );
  const updated = await query(
    `UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count`,
    [postId]
  );

  return { likes_count: updated[0]?.likes_count || 0, isLiked: true };
};

const addComment = async (postId: number | string, commentData: any) => {
  await ensureSchema();

  const { author_id, author_name, author_avatar, author_type, content } = commentData;

  const inserted = await query(
    `INSERT INTO post_comments (post_id, author_id, author_name, author_avatar, author_type, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, post_id, author_id, author_name, author_avatar, author_type, content, created_at`,
    [postId, author_id, author_name, author_avatar || null, author_type || 'student', content]
  );

  const updated = await query(
    `UPDATE posts
     SET comments_count = COALESCE(comments_count, 0) + 1
     WHERE id = $1
     RETURNING comments_count`,
    [postId]
  );

  return {
    ...inserted[0],
    comments_count: updated[0]?.comments_count || 0,
  };
};

const getComments = async (postId: number | string) => {
  await ensureSchema();

  return await query(
    `SELECT id, post_id, author_id, author_name, author_avatar, author_type, content, created_at
     FROM post_comments
     WHERE post_id = $1
     ORDER BY created_at ASC`,
    [postId]
  );
};

const sharePost = async (
  postId: number | string,
  userId: number | string,
  userType = "student",
  authorName = "Unknown",
  authorRole = "",
  authorAvatar = ""
) => {
  await ensureSchema();

  // Always resolve to the true original post (never repost a repost)
  const origRow = await query(`SELECT COALESCE(repost_of, id) AS real_id FROM posts WHERE id = $1`, [postId]);
  const realOrigId = origRow[0]?.real_id || postId;

  // Check if user already shared this original post
  const existing = await query(
    `SELECT id FROM post_shares WHERE post_id = $1 AND user_id = $2::text AND user_type = $3 LIMIT 1`,
    [realOrigId, userId, userType]
  );

  if (existing.length > 0) {
    // UNDO REPOST: remove share record, delete repost post, decrement count
    await query(
      `DELETE FROM post_shares WHERE post_id = $1 AND user_id = $2::text AND user_type = $3`,
      [realOrigId, userId, userType]
    );

    // Find and delete the repost post entry
    const deletedRepost = await query(
      `DELETE FROM posts WHERE repost_of = $1 AND author_id = $2::text AND author_type = $3 RETURNING id`,
      [realOrigId, userId, userType]
    );

    // Decrement share count on the original post
    const updated = await query(
      `UPDATE posts SET shares_count = GREATEST(COALESCE(shares_count, 0) - 1, 0) WHERE id = $1 RETURNING shares_count`,
      [realOrigId]
    );

    return {
      shares_count: updated[0]?.shares_count || 0,
      undone: true,
      deleted_repost_id: deletedRepost[0]?.id || null,
      original_post_id: Number(realOrigId),
    };
  }

  // CREATE REPOST: insert share record, create repost post, increment count
  await query(
    `INSERT INTO post_shares (post_id, user_id, user_type)
     VALUES ($1, $2::text, $3)`,
    [realOrigId, userId, userType]
  );

  // Increment share count on original post
  const updated = await query(
    `UPDATE posts SET shares_count = COALESCE(shares_count, 0) + 1 WHERE id = $1 RETURNING shares_count`,
    [realOrigId]
  );

  // Create a repost entry — a new post pointing to the original
  const repost = await query(
    `INSERT INTO posts (author_id, author_name, author_role, author_avatar, author_type, content, tags, repost_of)
     VALUES ($1, $2, $3, $4, $5, '', ARRAY[]::TEXT[], $6)
     RETURNING *`,
    [userId, authorName, authorRole, authorAvatar, userType, realOrigId]
  );

  return { shares_count: updated[0]?.shares_count || 0, already_shared: false, repost: repost[0], original_post_id: Number(realOrigId) };
};

const getTrendingTags = async (limit = 12) => {
  await ensureSchema();

  return await query(
    `SELECT LOWER(TRIM(tag)) AS tag, COUNT(*)::int AS uses
     FROM posts p, unnest(COALESCE(p.tags, ARRAY[]::text[])) AS tag
     WHERE tag IS NOT NULL AND TRIM(tag) <> ''
     GROUP BY LOWER(TRIM(tag))
     ORDER BY uses DESC, tag ASC
     LIMIT $1`,
    [limit]
  );
};

const getRecommendations = async (viewerId: number | string, viewerType: string, limit = 6) => {
  await ensureSchema();

  return await query(
    `SELECT
        p.author_id,
        p.author_type,
        p.author_name,
        p.author_role,
        p.author_avatar,
        MAX(p.created_at) AS latest_post_at,
        COUNT(*)::int AS posts_count,
        EXISTS (
            SELECT 1
            FROM community_follows f
            WHERE f.follower_id = $1
              AND f.follower_type = $2
              AND f.followed_id = p.author_id
              AND f.followed_type = p.author_type
        ) AS is_following
     FROM posts p
     WHERE NOT (p.author_id = $1 AND p.author_type = $2)
     GROUP BY p.author_id, p.author_type, p.author_name, p.author_role, p.author_avatar
     ORDER BY MAX(p.created_at) DESC
     LIMIT $3`,
    [viewerId, viewerType, limit]
  );
};

const toggleFollow = async (
  followerId: number | string,
  followerType: string,
  followedId: number | string,
  followedType: string
) => {
  await ensureSchema();

  if (String(followerId) === String(followedId) && String(followerType) === String(followedType)) {
    throw new Error("Cannot follow yourself");
  }

  const existing = await query(
    `SELECT id
     FROM community_follows
     WHERE follower_id = $1::text
       AND follower_type = $2
       AND followed_id = $3::text
       AND followed_type = $4
     LIMIT 1`,
    [followerId, followerType, followedId, followedType]
  );

  if (existing[0]) {
    await query(
      `DELETE FROM community_follows
       WHERE follower_id = $1::text
         AND follower_type = $2
         AND followed_id = $3::text
         AND followed_type = $4`,
      [followerId, followerType, followedId, followedType]
    );
    return { following: false };
  }

  await query(
    `INSERT INTO community_follows (follower_id, follower_type, followed_id, followed_type)
     VALUES ($1::text, $2, $3::text, $4)`,
    [followerId, followerType, followedId, followedType]
  );
  return { following: true };
};

const getFollowCounts = async (userId: string | number, userType: string) => {
  await ensureSchema();
  const [followersRes, followingRes] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS count FROM community_follows WHERE followed_id = $1::text AND followed_type = $2`,
      [userId, userType]
    ),
    query(
      `SELECT COUNT(*)::int AS count FROM community_follows WHERE follower_id = $1::text AND follower_type = $2`,
      [userId, userType]
    ),
  ]);
  return {
    followers: followersRes[0]?.count || 0,
    following: followingRes[0]?.count || 0,
  };
};

const getFollowers = async (
  userId: string | number,
  userType: string,
  viewerId?: string | number,
  viewerType?: string
) => {
  await ensureSchema();
  const params: any[] = [userId, userType];
  let isFollowingExpr = 'false';
  if (viewerId && viewerType) {
    params.push(viewerId, viewerType);
    isFollowingExpr = `EXISTS(SELECT 1 FROM community_follows cf WHERE cf.follower_id = $3::text AND cf.follower_type = $4 AND cf.followed_id = f.follower_id AND cf.followed_type = f.follower_type)`;
  }
  return await query(
    `SELECT
       f.follower_id::text as user_id,
       f.follower_type     as user_type,
       COALESCE(
         CASE WHEN f.follower_type = 'student' THEN st.name END,
         CASE WHEN f.follower_type = 'startup' THEN su.company_name END,
         p.author_name,
         'Unknown User'
       ) as name,
       COALESCE(p.author_role, f.follower_type) as role,
       COALESCE(
         CASE WHEN f.follower_type = 'student' THEN st.profile_photo END,
         CASE WHEN f.follower_type = 'startup' THEN sp.avatar_url END,
         CASE WHEN f.follower_type = 'startup' THEN su.logo_url END,
         p.author_avatar
       ) as avatar,
       ${isFollowingExpr} as is_following
     FROM community_follows f
     LEFT JOIN students st ON f.follower_type = 'student' AND st.id::text = f.follower_id::text
     LEFT JOIN startups su ON f.follower_type = 'startup' AND su.id::text = f.follower_id::text
     LEFT JOIN startup_profiles sp ON f.follower_type = 'startup' AND sp.startup_id::text = f.follower_id::text
     LEFT JOIN LATERAL (
       SELECT author_name, author_role, author_avatar
       FROM posts
       WHERE author_id = f.follower_id AND author_type = f.follower_type
       ORDER BY created_at DESC LIMIT 1
     ) p ON true
     WHERE f.followed_id = $1::text AND f.followed_type = $2
     ORDER BY f.created_at DESC`,
    params
  );
};

const getFollowing = async (
  userId: string | number,
  userType: string,
  viewerId?: string | number,
  viewerType?: string
) => {
  await ensureSchema();
  const params: any[] = [userId, userType];
  let isFollowingExpr = 'false';
  if (viewerId && viewerType) {
    params.push(viewerId, viewerType);
    isFollowingExpr = `EXISTS(SELECT 1 FROM community_follows cf WHERE cf.follower_id = $3::text AND cf.follower_type = $4 AND cf.followed_id = f.followed_id AND cf.followed_type = f.followed_type)`;
  }
  return await query(
    `SELECT
       f.followed_id::text as user_id,
       f.followed_type     as user_type,
       COALESCE(
         CASE WHEN f.followed_type = 'student' THEN st.name END,
         CASE WHEN f.followed_type = 'startup' THEN su.company_name END,
         p.author_name,
         'Unknown User'
       ) as name,
       COALESCE(p.author_role, f.followed_type) as role,
       COALESCE(
         CASE WHEN f.followed_type = 'student' THEN st.profile_photo END,
         CASE WHEN f.followed_type = 'startup' THEN sp.avatar_url END,
         CASE WHEN f.followed_type = 'startup' THEN su.logo_url END,
         p.author_avatar
       ) as avatar,
       ${isFollowingExpr} as is_following
     FROM community_follows f
     LEFT JOIN students st ON f.followed_type = 'student' AND st.id::text = f.followed_id::text
     LEFT JOIN startups su ON f.followed_type = 'startup' AND su.id::text = f.followed_id::text
     LEFT JOIN startup_profiles sp ON f.followed_type = 'startup' AND sp.startup_id::text = f.followed_id::text
     LEFT JOIN LATERAL (
       SELECT author_name, author_role, author_avatar
       FROM posts
       WHERE author_id = f.followed_id AND author_type = f.followed_type
       ORDER BY created_at DESC LIMIT 1
     ) p ON true
     WHERE f.follower_id = $1::text AND f.follower_type = $2
     ORDER BY f.created_at DESC`,
    params
  );
};

const deletePost = async (postId: number | string, authorId: number | string) => {
  await ensureSchema();

  const result = await query(`DELETE FROM posts WHERE id = $1 AND author_id = $2 RETURNING id`, [postId, authorId]);
  return result[0] || null;
};

const editPost = async (
  postId: number | string,
  authorId: number | string,
  payload: {
    content: string;
    updateMedia?: boolean;
    media_url?: string | null;
    media_name?: string | null;
  }
) => {
  await ensureSchema();

  const { content, updateMedia, media_url, media_name } = payload;

  if (updateMedia) {
    const result = await query(
      `UPDATE posts
       SET content = $1,
           media_url = $2,
           media_name = $3,
           updated_at = NOW()
       WHERE id = $4 AND author_id = $5
       RETURNING *`,
      [content, media_url ?? null, media_name ?? null, postId, authorId]
    );
    return result[0] || null;
  }

  const result = await query(
    `UPDATE posts SET content = $1, updated_at = NOW() WHERE id = $2 AND author_id = $3 RETURNING *`,
    [content, postId, authorId]
  );
  return result[0] || null;
};

// post_saves table is now created inside ensureSchema
const ensurePostSaves = ensureSchema;

const toggleSavePost = async (postId: number | string, userId: string, userType: string): Promise<{ saved: boolean }> => {
  await ensurePostSaves();
  const existing = await query(
    `SELECT id FROM post_saves WHERE post_id = $1 AND user_id = $2::text AND user_type = $3`,
    [Number(postId), userId, userType]
  );
  if (existing.length > 0) {
    await query(`DELETE FROM post_saves WHERE post_id = $1 AND user_id = $2::text AND user_type = $3`, [Number(postId), userId, userType]);
    return { saved: false };
  }
  await query(`INSERT INTO post_saves (post_id, user_id, user_type) VALUES ($1, $2::text, $3)`, [Number(postId), userId, userType]);
  return { saved: true };
};

const getSavedPosts = async (userId: string, userType: string): Promise<any[]> => {
  await ensurePostSaves();
  return await query(
    `SELECT ${POST_LIST_COLS}, ${ORIGINAL_POST_COLS}
     FROM posts p
     LEFT JOIN posts op ON p.repost_of = op.id
     INNER JOIN post_saves ps ON ps.post_id = p.id
     WHERE ps.user_id = $1::text AND ps.user_type = $2
     ORDER BY ps.created_at DESC`,
    [userId, userType]
  );
};

export {
  getPosts,
  getPostMedia,
  createPost,
  likePost,
  addComment,
  getComments,
  sharePost,
  getFollowCounts,
  getFollowers,
  getFollowing,
  getTrendingTags,
  getRecommendations,
  toggleFollow,
  deletePost,
  editPost,
  toggleSavePost,
  getSavedPosts,
  ensureSchema as warmUpSchema,
};
