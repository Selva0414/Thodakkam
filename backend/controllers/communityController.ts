import { Request, Response } from "express";
import * as Community from "../models/communityModel";
import { findStudentById } from "../models/studentModel";
import StartupModel from "../models/startupModel";
import { query } from "../config/database";

import { resolveMediaUrl } from "../utils/mediaUrl";
import { debugAgentLog } from "../utils/debugAgentLog";
import NotificationModel from "../models/notificationModel";
import { createCache, memoizeAsync } from "../utils/cache";

// Short-lived cache for the meta panel (trending tags + recommendations).
// Keyed by viewer so per-user recommendations stay correct.
const metaCache = createCache<{ trending_tags: any; recommendations: any }>({ max: 1000, ttlMs: 60_000 });
const getMetaCached = memoizeAsync(metaCache, async (key: string) => {
  const [viewerType, viewerIdRaw] = key.split(":");
  const viewerId = viewerIdRaw === "null" ? undefined : viewerIdRaw;
  const [trendingTags, recommendations] = await Promise.all([
    Community.getTrendingTags(12),
    Community.getRecommendations(viewerId, viewerType, 8),
  ]);
  return { trending_tags: trendingTags, recommendations };
});

export const getFeed = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user ? (req as any).user.id : null;
    const userType = (req as any).user?.role || 'student';
    const posts = await Community.getPosts(userId, userType);
    res.json(posts);
  } catch (error: any) {
    // #region agent log
    debugAgentLog({
      location: "communityController.ts:getFeed:catch",
      message: "getFeed failed",
      data: {
        errMessage: String(error?.message || error),
        errCode: error?.code,
        errDetail: error?.detail,
      },
      hypothesisId: "H3",
    });
    // #endregion
    res.status(500).json({ error: error.message });
  }
};

export const getMeta = async (req: Request, res: Response): Promise<any> => {
  try {
    const viewerId = (req as any).user?.id;
    const viewerType = (req as any).user?.role || "student";
    const { trending_tags, recommendations } = await getMetaCached(`${viewerType}:${viewerId ?? "null"}`);
    res.json({ trending_tags, recommendations, quick_tips: ["Keep your description concise and goal-oriented.", "Add high-quality images to increase engagement.", "Project and Certification tags improve discoverability."] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createNewPost = async (req: Request, res: Response): Promise<any> => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Community] createNewPost called by user:", (req as any).user?.id);
  }
  try {
    let authorData: any;
    const role = (req as any).user.role || "student";

    if (role === "startup") {
      const startup = await StartupModel.findById((req as any).user.id);
      if (!startup) return res.status(401).json({ error: "Startup not found or session expired" });
      const startupAvatar = startup.logo_url
        ? (resolveMediaUrl(req, startup.logo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.company_name)}&background=0F172A&color=fff`)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.company_name)}&background=0F172A&color=fff`;
      authorData = { id: startup.id, name: startup.company_name, role: "Startup", avatar: startupAvatar };
    } else {
      const student = await findStudentById((req as any).user.id);
      if (!student) return res.status(401).json({ error: "Student not found or session expired" });
      authorData = { id: student.id, name: student.name, role: "Student", avatar: student.profile_photo ? `/api/students/${student.id}/avatar` : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random` };
    }

    let media_url = null;
    const { media_base64, media_type, media_name } = req.body;
    if (media_base64 && media_type) media_url = `data:${media_type};base64,${media_base64}`;
    const normalizedMediaName = typeof media_name === "string" && media_name.trim() ? media_name.trim() : null;

    const postData = { author_id: authorData.id, author_name: authorData.name, author_role: authorData.role, author_avatar: authorData.avatar, author_type: role, content: req.body.content, tags: req.body.tags || [], media_url, media_name: normalizedMediaName };
    const post = await Community.createPost(postData);
    res.status(201).json(post);
  } catch (error: any) {
    console.error("[Community] Error in createNewPost:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const handleLike = async (req: Request, res: Response): Promise<any> => {
  try {
    const { postId } = req.params;
    const userId = (req as any).user.id;
    const result = await Community.likePost(postId as string, userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addComment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { postId } = req.params;
    const content = String(req.body?.content || "").trim();
    if (!content) return res.status(400).json({ error: "Comment content is required." });

    let authorData: any;
    const role = (req as any).user?.role || "student";
    if (role === "startup") {
      const startup = await StartupModel.findById((req as any).user.id);
      if (!startup) return res.status(401).json({ error: "Startup not found or session expired" });
      const startupAvatar2 = startup.logo_url
        ? (resolveMediaUrl(req, startup.logo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.company_name)}&background=0F172A&color=fff`)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.company_name)}&background=0F172A&color=fff`;
      authorData = { author_id: startup.id, author_name: startup.company_name, author_avatar: startupAvatar2, author_type: "startup" };
    } else {
      const student = await findStudentById((req as any).user.id);
      if (!student) return res.status(401).json({ error: "Student not found or session expired" });
      authorData = { author_id: student.id, author_name: student.name, author_avatar: student.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`, author_type: "student" };
    }

    const created = await Community.addComment(postId as string, { ...authorData, content });

    const io = req.app.get("io");
    if (io) {
      const normalizedPostId = Number(postId);
      io.to("community_feed").emit("community_comment_added", {
        post_id: Number.isNaN(normalizedPostId) ? postId : normalizedPostId,
        comment: created,
        comments_count: created?.comments_count ?? null,
      });
    }

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getComments = async (req: Request, res: Response): Promise<any> => {
  try {
    const { postId } = req.params;
    const comments = await Community.getComments(postId as string);
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const sharePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { postId } = req.params;
    const userId = (req as any).user.id;
    const userType = (req as any).user.role || "student";

    // Resolve author info for the repost card
    let authorName = "Unknown";
    let authorRole = "";
    let authorAvatar = "";
    if (userType === "startup") {
      const startup = await StartupModel.findById(userId);
      if (startup) {
        authorName = startup.company_name;
        authorRole = "Startup";
        authorAvatar = startup.logo_url
          ? (resolveMediaUrl(req, startup.logo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.company_name)}&background=0F172A&color=fff`)
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.company_name)}&background=0F172A&color=fff`;
      }
    } else {
      const student = await findStudentById(userId);
      if (student) {
        authorName = student.name;
        authorRole = "Student";
        authorAvatar = student.profile_photo
          ? `/api/students/${student.id}/avatar`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
      }
    }

    const result = await Community.sharePost(postId as string, userId, userType, authorName, authorRole, authorAvatar);

    const io = req.app.get("io");
    if (io) {
      const originalPostId = result?.original_post_id ?? Number(postId);
      io.to("community_feed").emit("community_post_shared", {
        post_id: originalPostId,
        shares_count: result?.shares_count ?? 0,
        undone: Boolean(result?.undone),
        deleted_repost_id: result?.deleted_repost_id || null,
        repost: result?.repost || null,
        actor_id: String(userId),
        actor_type: String(userType || "student").toLowerCase(),
      });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleFollow = async (req: Request, res: Response): Promise<any> => {
  try {
    const followerId = String((req as any).user.id);
    const followerType = (req as any).user.role || "student";
    const followedId = String(req.body?.followed_id || '').trim();
    const followedType = String(req.body?.followed_type || "").toLowerCase() || "student";

    if (!followedId) return res.status(400).json({ error: "Invalid followed_id" });
    const result = await Community.toggleFollow(followerId, followerType, followedId, followedType);

    // If this is a new follow (not unfollow), send a notification to the followed student
    if (result.following && followedType === "student") {
      try {
        // Get the follower's display name
        let followerName = "Someone";
        if (followerType === "startup") {
          const startup = await StartupModel.findById(followerId);
          followerName = startup?.company_name || "A Startup";
        } else {
          const student = await findStudentById(Number(followerId));
          followerName = student?.name || "A Student";
        }

        await NotificationModel.createTable();
        const notification = await NotificationModel.createNotification({
          student_id: followedId,
          title: `${followerName} started following you`,
          message: `${followerName} is now following you on the community. Check out who's in your network!`,
          type: "follow_request",
          link: "/student/community/network"
        });

        const io = req.app.get("io");
        if (io && notification) {
          const unreadCount = await NotificationModel.getUnreadCount(followedId);
          io.to(`${followedId}_student`).emit("new_notification", { notification, unreadCount });
        }
      } catch (notifErr: any) {
        console.error("[toggleFollow] Could not send follow notification:", notifErr.message);
      }
    }

    res.json(result);
  } catch (error: any) {
    if (error.message === "Cannot follow yourself") return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { postId } = req.params;
    const userId = (req as any).user.id;
    const deleted = await Community.deletePost(postId as string, userId);
    if (!deleted) return res.status(404).json({ error: "Post not found or not authorised." });
    res.json({ success: true, id: deleted.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const editPost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { postId } = req.params;
    const userId = (req as any).user.id;
    const { content, media_base64, media_type, media_name, remove_media } = req.body;
    const normalizedContent = String(content || '').trim();
    if (!normalizedContent) return res.status(400).json({ error: "Content is required." });

    const shouldRemoveMedia = remove_media === true;
    const hasNewMedia = Boolean(media_base64 && media_type);
    const shouldUpdateMedia = shouldRemoveMedia || hasNewMedia;

    const media_url = hasNewMedia ? `data:${media_type};base64,${media_base64}` : null;
    const normalizedMediaName = hasNewMedia && typeof media_name === 'string' && media_name.trim()
      ? media_name.trim()
      : null;

    const updated = await Community.editPost(postId as string, userId, {
      content: normalizedContent,
      updateMedia: shouldUpdateMedia,
      media_url: shouldRemoveMedia ? null : media_url,
      media_name: shouldRemoveMedia ? null : normalizedMediaName,
    });

    if (!updated) return res.status(404).json({ error: "Post not found or not authorised." });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFollowCounts = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const userType = (req as any).user.role || 'student';
    const counts = await Community.getFollowCounts(userId, userType);
    res.json(counts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPostMedia = async (req: Request, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    const row = await Community.getPostMedia(postId as string);
    if (!row || !row.media_url) return res.status(404).json({ error: "No media" });
    res.json({ media_url: row.media_url, media_name: row.media_name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = String(req.params.userId);
    const userType = String(req.query.userType || 'student');
    const viewerId = (req as any).user?.id;
    const viewerType = (req as any).user?.role || 'student';
    const users = await Community.getFollowers(userId, userType, viewerId, viewerType);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = String(req.params.userId);
    const userType = String(req.query.userType || 'student');
    const viewerId = (req as any).user?.id;
    const viewerType = (req as any).user?.role || 'student';
    const users = await Community.getFollowing(userId, userType, viewerId, viewerType);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleSavePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const postId = String(req.params.postId);
    const userId = String((req as any).user.id);
    const userType = (req as any).user?.role || 'student';
    const result = await Community.toggleSavePost(postId, userId, userType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSavedPostsFeed = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = String((req as any).user.id);
    const userType = (req as any).user?.role || 'student';
    const posts = await Community.getSavedPosts(userId, userType);
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
