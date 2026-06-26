import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { query } from "../config/database";
import { findStudentById } from "../models/studentModel";
import StartupModel from "../models/startupModel";

const buildValidationError = (req: Request) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return { statusCode: 400, body: { success: false, message: errors.array()[0].msg } };
};

const isValidPostId = (id: any) => Number.isInteger(Number(id)) && Number(id) > 0;

const normalizeUserType = (value: any) => {
  const raw = String(value || "").toLowerCase().trim();
  if (raw.startsWith("candidate")) return "student";
  if (raw.startsWith("startup")) return "startup";
  return "student";
};

const getAuthorData = async (req: Request) => {
  const role = normalizeUserType((req as any).user?.role);
  const id = Number((req as any).user?.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  if (role === "startup") {
    const startup = await StartupModel.findById(id);
    if (!startup) return null;
    return {
      author_id: Number(startup.id),
      author_type: "startup",
      author_name: startup.company_name,
      author_role: "Startup",
      author_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.company_name)}&background=0F172A&color=fff`,
    };
  }

  const student = await findStudentById(id);
  if (!student) return null;
  return {
    author_id: Number(student.id),
    author_type: "student",
    author_name: student.name,
    author_role: "Student",
    author_avatar: student.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`,
  };
};

export const createPost = async (req: Request, res: Response): Promise<any> => {
  try {
    const validationError = buildValidationError(req);
    if (validationError) return res.status(validationError.statusCode).json(validationError.body);

    const author = await getAuthorData(req);
    if (!author) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { content, media, tags } = req.body;
    const rows = await query(
      `INSERT INTO posts (author_id, author_name, author_role, author_avatar, content, tags, author_type, media_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [author.author_id, author.author_name, author.author_role, author.author_avatar, String(content).trim(), Array.isArray(tags) ? tags : [], author.author_type, media || null]
    );

    const post = { ...rows[0], likes: [], media: rows[0]?.media_url || null, userId: rows[0]?.author_id };
    return res.status(201).json({ success: true, message: "Post created successfully", data: post });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to create post" });
  }
};

export const getPosts = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const tag = String(req.query.tag || "").trim();
    const whereParts: string[] = [];
    const params: any[] = [];

    if (tag) {
      params.push(tag);
      whereParts.push(`$${params.length} = ANY(tags)`);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(skip);
    const offsetParam = `$${params.length}`;

    const rows = await query(
      `SELECT p.*, COALESCE((SELECT array_agg(l.user_id) FROM post_likes l WHERE l.post_id = p.id), ARRAY[]::INTEGER[]) AS likes
       FROM posts p ${whereClause} ORDER BY p.created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    const countParams = tag ? [tag] : [];
    const countRows = await query(`SELECT COUNT(*)::int AS total FROM posts ${whereClause ? "WHERE $1 = ANY(tags)" : ""}`, countParams);

    const posts = rows.map((post: any) => ({
      ...post, media: post.media_url, userId: { id: post.author_id, name: post.author_name, avatar: post.author_avatar },
    }));
    const total = countRows[0]?.total || 0;

    return res.status(200).json({
      success: true, message: "Posts fetched successfully",
      data: { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const validationError = buildValidationError(req);
    if (validationError) return res.status(validationError.statusCode).json(validationError.body);

    const postId = Number(req.params.id);
    if (!isValidPostId(postId)) return res.status(400).json({ success: false, message: "Invalid post id" });

    const existingRows = await query(`SELECT id, author_id, author_type FROM posts WHERE id = $1 LIMIT 1`, [postId]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ success: false, message: "Post not found" });

    const actorId = Number((req as any).user?.id);
    const actorType = normalizeUserType((req as any).user?.role);
    if (Number(existing.author_id) !== actorId || normalizeUserType(existing.author_type) !== actorType) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { content, media, tags } = req.body;
    const updatedRows = await query(
      `UPDATE posts SET content = $1, media_url = $2, tags = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [String(content).trim(), media || null, Array.isArray(tags) ? tags : [], postId]
    );

    const updatedPost = { ...updatedRows[0], media: updatedRows[0]?.media_url, userId: updatedRows[0]?.author_id };
    return res.status(200).json({ success: true, message: "Post updated successfully", data: updatedPost });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to update post" });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const postId = Number(req.params.id);
    if (!isValidPostId(postId)) return res.status(400).json({ success: false, message: "Invalid post id" });

    const existingRows = await query(`SELECT id, author_id, author_type FROM posts WHERE id = $1 LIMIT 1`, [postId]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ success: false, message: "Post not found" });

    const actorId = Number((req as any).user?.id);
    const actorType = normalizeUserType((req as any).user?.role);
    if (Number(existing.author_id) !== actorId || normalizeUserType(existing.author_type) !== actorType) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await query(`DELETE FROM posts WHERE id = $1`, [postId]);
    return res.status(200).json({ success: true, message: "Post deleted successfully", data: { id: postId } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to delete post" });
  }
};

export const toggleLike = async (req: Request, res: Response): Promise<any> => {
  try {
    const postId = Number(req.params.id);
    if (!isValidPostId(postId)) return res.status(400).json({ success: false, message: "Invalid post id" });

    const userId = Number((req as any).user?.id);
    if (!Number.isFinite(userId) || userId <= 0) return res.status(401).json({ success: false, message: "Unauthorized" });

    const postRows = await query(`SELECT id FROM posts WHERE id = $1 LIMIT 1`, [postId]);
    if (!postRows[0]) return res.status(404).json({ success: false, message: "Post not found" });

    const existingLike = await query(`SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1`, [postId, userId]);

    let liked = false;
    if (existingLike[0]) {
      await query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
      await query(`UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1`, [postId]);
      liked = false;
    } else {
      await query(`INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [postId, userId]);
      await query(`UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1`, [postId]);
      liked = true;
    }

    const likesRows = await query(`SELECT COALESCE(array_agg(user_id), ARRAY[]::INTEGER[]) AS likes FROM post_likes WHERE post_id = $1`, [postId]);
    const likes = likesRows[0]?.likes || [];

    return res.status(200).json({
      success: true, message: liked ? "Post liked successfully" : "Post unliked successfully",
      data: { postId, likes, likesCount: likes.length, liked },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};
