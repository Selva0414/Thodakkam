import { Request, Response } from "express";
import * as messageModel from "../models/messageModel";
import * as studentModel from "../models/studentModel";
import multer from "multer";
import { query } from "../config/database";
import { debugAgentLog } from "../utils/debugAgentLog";

const buildConversationKey = (userAId: any, userAType: any, userBId: any, userBType: any) => {
  const pair = [
    { id: String(userAId), type: String(userAType) },
    { id: String(userBId), type: String(userBType) },
  ].sort((a, b) => {
    if (a.id !== b.id) return a.id.localeCompare(b.id);
    return a.type.localeCompare(b.type);
  });
  return `${pair[0].id}:${pair[0].type}:${pair[1].id}:${pair[1].type}`;
};

const parseConversationKey = (conversationKey: string) => {
  const parts = String(conversationKey || "").split(":");
  if (parts.length !== 4) throw new Error("Invalid conversation key format");

  const user1Id = String(parts[0]);
  const user1Type = parts[1];
  const user2Id = String(parts[2]);
  const user2Type = parts[3];

  if (!user1Id || !user2Id || !user1Type || !user2Type) {
    throw new Error("Invalid conversation key values");
  }

  return { user1Id, user1Type, user2Id, user2Type };
};

const normalizeUserType = (userType: any) => {
  const raw = String(userType || "").toLowerCase().trim();
  if (raw.startsWith("candidate") || raw.startsWith("student")) return "student";
  if (raw.startsWith("startup")) return "startup";
  if (raw.startsWith("admin")) return "admin";
  return raw;
};

const getUserRoom = (userId: any, userType: any) => `${String(userId)}_${normalizeUserType(userType)}`;

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/webp",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain"
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const sendMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const senderId = (req as any).user.id;
    const senderType = normalizeUserType((req as any).user.role || "student");
    const { receiverId, receiverType, receiverUsername, content, reply_to_message_id } = req.body;

    if (!content) return res.status(400).json({ success: false, message: "Content is required." });

    let targetId = receiverId;
    let targetType = normalizeUserType(receiverType);

    if (String(targetId) === "admin" || targetType === "admin") {
      const adminResult = await query("SELECT id FROM master_admins LIMIT 1");
      if (adminResult.length > 0) {
        targetId = adminResult[0].id;
        targetType = "admin";
      }
    }

    if (!targetId && receiverUsername) {
      const receiver = await studentModel.findStudentByUsername(receiverUsername);
      if (!receiver) return res.status(404).json({ success: false, message: "Receiver not found." });
      targetId = receiver.id;
      targetType = "student";
    }

    if (!targetId || !targetType) return res.status(400).json({ success: false, message: "Receiver identity is required." });

    if (reply_to_message_id) {
      const replyToMessage = await messageModel.getMessageById(reply_to_message_id);
      if (!replyToMessage) return res.status(404).json({ success: false, message: "Reply target message not found." });
    }

    const newMessage = await messageModel.createMessage(senderId, senderType, targetId, targetType, content, {
      reply_to_message_id: reply_to_message_id || null,
    });

    const io = req.app.get("io");
    if (io) {
      const receiverRoom = getUserRoom(targetId, targetType);
      const senderRoom = getUserRoom(senderId, senderType);
      const conversationId = buildConversationKey(senderId, senderType, targetId, targetType);
      const payload = { ...newMessage, conversationId };

      io.to(senderRoom).emit("sendMessage", payload);
      io.to(receiverRoom).emit("receiveMessage", payload);
      io.to(receiverRoom).emit("new_message", newMessage);
      io.to(senderRoom).emit("new_message", newMessage);
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error("Send message error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

export const sendFileMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const senderId = (req as any).user.id;
    const senderType = normalizeUserType((req as any).user.role || "student");
    const { receiverId, receiverType, reply_to_message_id } = req.body;
    let targetId = receiverId;
    let targetType = normalizeUserType(receiverType);

    if (String(targetId) === "admin" || targetType === "admin") {
      const adminResult = await query("SELECT id FROM master_admins LIMIT 1");
      if (adminResult.length > 0) {
        targetId = adminResult[0].id;
        targetType = "admin";
      }
    }

    if (!req.file) return res.status(400).json({ success: false, message: "File is required." });
    if (!targetId || !targetType) return res.status(400).json({ success: false, message: "Receiver identity is required." });

    if (reply_to_message_id) {
      const replyToMessage = await messageModel.getMessageById(reply_to_message_id);
      if (!replyToMessage) return res.status(404).json({ success: false, message: "Reply target message not found." });
    }

    const isImage = req.file.mimetype.startsWith("image/");
    const messageType = isImage ? "image" : "file";

    const newMessage = await messageModel.createMessage(
      senderId, senderType, targetId, targetType,
      req.body.caption || (isImage ? "📷 Image" : `📎 ${req.file.originalname}`),
      {
        message_type: messageType,
        file_name: req.file.originalname,
        file_size: req.file.size,
        attachment_data: req.file.buffer,
        attachment_mime_type: req.file.mimetype,
        reply_to_message_id: reply_to_message_id || null,
      }
    );

    const io = req.app.get("io");
    if (io) {
      const receiverRoom = getUserRoom(targetId, targetType);
      const senderRoom = getUserRoom(senderId, senderType);
      const conversationId = buildConversationKey(senderId, senderType, targetId, targetType);
      const payload = { ...newMessage, conversationId };

      io.to(senderRoom).emit("sendMessage", payload);
      io.to(receiverRoom).emit("receiveMessage", payload);
      io.to(receiverRoom).emit("new_message", newMessage);
      io.to(senderRoom).emit("new_message", newMessage);
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error("Send file message error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send file message." });
  }
};

export const getAttachment = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = String((req as any).user.id);
    const { messageId } = req.params;
    const result = await query(
      `SELECT attachment_data, attachment_mime_type, file_name, sender_id, sender_type, receiver_id, receiver_type FROM messages WHERE id = $1`,
      [messageId]
    );
    if (!result.length || !result[0].attachment_data) {
      return res.status(404).json({ success: false, message: "Attachment not found." });
    }
    const msg = result[0];
    if (String(msg.sender_id) !== userId && String(msg.receiver_id) !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }
    const mime = msg.attachment_mime_type || "application/octet-stream";
    const fileName = msg.file_name || "attachment";
    res.set({
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "_")}"`,
      "Cache-Control": "public, max-age=86400, immutable",
    });
    return res.send(msg.attachment_data);
  } catch (error: any) {
    console.error("Get attachment error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to get attachment." });
  }
};

export const sendMeetLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const senderId = (req as any).user.id;
    const senderType = normalizeUserType((req as any).user.role || "student");
    const { receiverId, receiverType, meetLink, caption } = req.body;
    const normalizedReceiverType = normalizeUserType(receiverType);

    if (!meetLink) return res.status(400).json({ success: false, message: "Meet link is required." });
    if (!receiverId || !normalizedReceiverType) return res.status(400).json({ success: false, message: "Receiver identity is required." });

    const meetRegex = /^https:\/\/meet\.google\.com\/.+/i;
    if (!meetRegex.test(meetLink)) return res.status(400).json({ success: false, message: "Invalid Google Meet URL." });

    const newMessage = await messageModel.createMessage(
      senderId, senderType, receiverId, normalizedReceiverType,
      caption || `📹 Join the meeting: ${meetLink}`,
      { message_type: "meet_link", file_url: meetLink }
    );

    const io = req.app.get("io");
    if (io) {
      const receiverRoom = getUserRoom(receiverId, normalizedReceiverType);
      const senderRoom = getUserRoom(senderId, senderType);
      const conversationId = buildConversationKey(senderId, senderType, receiverId, normalizedReceiverType);
      const payload = { ...newMessage, conversationId };

      io.to(senderRoom).emit("sendMessage", payload);
      io.to(receiverRoom).emit("receiveMessage", payload);
      io.to(receiverRoom).emit("new_message", newMessage);
      io.to(senderRoom).emit("new_message", newMessage);
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error("Send meet link error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send meet link." });
  }
};

export const getConversation = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    if (!userId) {
      console.warn("Invalid userId in getConversation:", userId);
      return res.status(400).json({ success: false, message: "Invalid token payload (getConversation)." });
    }
    const userType = normalizeUserType((req as any).user.role || "student");
    const { otherUserId } = req.params;
    const { otherUserType, limit, offset } = req.query;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: "Invalid other user ID." });
    }
    if (!otherUserType) return res.status(400).json({ success: false, message: "Other user type is required." });

    let targetId = String(otherUserId);
    let targetType = normalizeUserType(String(otherUserType));

    if (targetId === "admin" || targetType === "admin") {
      const adminResult = await query("SELECT id FROM master_admins LIMIT 1");
      if (adminResult.length > 0) {
        targetId = adminResult[0].id;
        targetType = "admin";
      }
    }

    const messages = await messageModel.getConversation(userId, userType, targetId, targetType, { limit: Number(limit) || 50, offset: Number(offset) || 0 });
    const seenMessages = await messageModel.markConversationSeen(userId, userType, targetId, targetType);

    const io = req.app.get("io");
    if (io) {
      const senderRoom = getUserRoom(targetId, targetType);
      const conversationId = buildConversationKey(userId, userType, targetId, targetType);

      if (seenMessages.length > 0) {
        io.to(senderRoom).emit("messageSeen", {
          conversationId, byUserId: userId, byUserType: userType, messageIds: seenMessages.map((m: any) => m.id),
        });
      }
      io.to(senderRoom).emit("messages_read", { by: userId, byType: userType });
    }

    res.json({ success: true, data: messages });
  } catch (error: any) {
    console.error("Get conversation error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch conversation." });
  }
};

export const markMessageDelivered = async (req: Request, res: Response): Promise<any> => {
  try {
    const receiverId = (req as any).user.id;
    const receiverType = normalizeUserType((req as any).user.role || "student");
    const { messageId } = req.params;

    const updated = await messageModel.markMessageDelivered(messageId, receiverId, receiverType);
    if (!updated) return res.status(404).json({ success: false, message: "Message not found or already delivered." });

    const io = req.app.get("io");
    if (io) {
      const senderRoom = getUserRoom(updated.sender_id, updated.sender_type);
      const receiverRoom = getUserRoom(updated.receiver_id, updated.receiver_type);
      const conversationId = buildConversationKey(updated.sender_id, updated.sender_type, updated.receiver_id, updated.receiver_type);
      const payload = { messageId: updated.id, status: updated.status, conversationId, receiverId: updated.receiver_id, receiverType: updated.receiver_type };

      io.to(senderRoom).emit("messageDelivered", payload);
      io.to(receiverRoom).emit("messageDelivered", payload);
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Mark delivered error:", error.message);
    res.status(500).json({ success: false, message: "Failed to mark message as delivered." });
  }
};

export const markConversationSeen = async (req: Request, res: Response): Promise<any> => {
  try {
    const viewerId = (req as any).user.id;
    const viewerType = normalizeUserType((req as any).user.role || "student");
    const { conversationId } = req.params;

    const parsed = parseConversationKey(conversationId as string);
    let otherUserId: string;
    let otherUserType: string;
    const normalizedViewerId = String(viewerId);

    if (parsed.user1Id === normalizedViewerId && parsed.user1Type === viewerType) {
      otherUserId = parsed.user2Id;
      otherUserType = parsed.user2Type;
    } else if (parsed.user2Id === normalizedViewerId && parsed.user2Type === viewerType) {
      otherUserId = parsed.user1Id;
      otherUserType = parsed.user1Type;
    } else {
      return res.status(403).json({ success: false, message: "Conversation does not belong to current user." });
    }

    let targetId = otherUserId;
    let targetType = normalizeUserType(otherUserType);

    if (targetId === "admin" || targetType === "admin") {
      const adminResult = await query("SELECT id FROM master_admins LIMIT 1");
      if (adminResult.length > 0) {
        targetId = adminResult[0].id;
        targetType = "admin";
      }
    }

    const updatedRows = await messageModel.markConversationSeen(viewerId, viewerType, targetId, targetType);
    const updatedMessageIds = updatedRows.map((m: any) => m.id);

    const io = req.app.get("io");
    if (io && updatedMessageIds.length > 0) {
      const otherRoom = getUserRoom(targetId, targetType);
      io.to(otherRoom).emit("messageSeen", { conversationId, byUserId: viewerId, byUserType: viewerType, messageIds: updatedMessageIds });
      io.to(otherRoom).emit("messages_read", { by: viewerId, byType: viewerType });
    }

    res.json({ success: true, data: { conversationId, updatedCount: updatedMessageIds.length, updatedMessageIds } });
  } catch (error: any) {
    console.error("Mark seen error:", error.message);
    res.status(400).json({ success: false, message: error.message || "Failed to mark conversation as seen." });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    if (!userId) {
      console.warn("Invalid userId in getConversations:", userId);
      return res.status(400).json({ success: false, message: "Invalid token payload (getConversations)." });
    }
    const userType = normalizeUserType((req as any).user.role || "student");
    const conversations = await messageModel.getConversations(userId, userType);
    res.json({ success: true, data: conversations });
  } catch (error: any) {
    console.error("Get conversations error:", error.message);
    // #region agent log
    debugAgentLog({
      location: "messageController.ts:getConversations:catch",
      message: "getConversations failed",
      data: {
        errMessage: String(error?.message || error),
        errCode: error?.code,
        errDetail: error?.detail,
      },
      hypothesisId: "H4",
    });
    // #endregion
    res.status(500).json({ success: false, message: "Failed to fetch conversations." });
  }
};

export const getCandidateContacts = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = (req as any).user.id;
    const candidates = await query(`
      SELECT DISTINCT ON (s.id)
        s.id AS other_user_id, 'student' AS other_user_type, s.name AS other_user_name, s.username AS other_user_username,
        COALESCE(s.profile_photo, 'https://ui-avatars.com/api/?name=' || COALESCE(s.name, 'U') || '&background=F1F5F9&color=6D28D9') AS other_user_avatar,
        a.role_applied, a.status AS application_status, j.title AS job_title
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN students s ON (s.id = a.student_id OR LOWER(s.email) = LOWER(a.candidate_email))
      WHERE j.startup_id::text = $1::text
      ORDER BY s.id, a.applied_at DESC
    `, [startupId]);

    const userType = normalizeUserType((req as any).user.role || "startup");
    const existingConversations = await messageModel.getConversations(startupId, userType);

    const enriched = candidates.map((candidate: any) => {
      const conv = existingConversations.find((c: any) => c.other_user_id === candidate.other_user_id && c.other_user_type === "student");
      return {
        ...candidate,
        last_message: conv?.last_message || null,
        last_message_type: conv?.last_message_type || null,
        last_message_time: conv?.last_message_time || null,
      };
    });

    enriched.sort((a: any, b: any) => {
      if (a.last_message_time && b.last_message_time) {
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      }
      if (a.last_message_time) return -1;
      if (b.last_message_time) return 1;
      return (a.other_user_name || "").localeCompare(b.other_user_name || "");
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error("Get candidate contacts error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch candidate contacts." });
  }
};

export const unsendMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const userType = (req as any).user.role || "student";
    const { messageId } = req.params;

    const result = await messageModel.unsendMessage(messageId, userId, userType);

    const io = req.app.get("io");
    if (io) {
      io.to(getUserRoom(result.sender_id, result.sender_type)).emit("messageUnsent", { messageId: result.id, senderId: result.sender_id, receiverId: result.receiver_id });
      io.to(getUserRoom(result.receiver_id, result.receiver_type)).emit("messageUnsent", { messageId: result.id, senderId: result.sender_id, receiverId: result.receiver_id });
    }

    res.json({ success: true, message: "Message unsent successfully", data: { messageId: result.id } });
  } catch (error: any) {
    console.error("Unsend message error:", error.message);
    res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
  }
};

export const deleteMessageForMe = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;

    const result = await messageModel.deleteMessageForMe(messageId, userId);
    res.json({ success: true, message: "Message deleted for you successfully", data: { messageId: result.id } });
  } catch (error: any) {
    console.error("Delete message for me error:", error.message);
    res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
  }
};

export const editMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") throw new Error("Message content is required");

    const result = await messageModel.editMessage(messageId, userId, content);

    const io = req.app.get("io");
    if (io) {
      io.to(getUserRoom(result.sender_id, result.sender_type)).emit("messageEdited", result);
      io.to(getUserRoom(result.receiver_id, result.receiver_type)).emit("messageEdited", result);
    }

    res.json({ success: true, message: "Message edited successfully", data: result });
  } catch (error: any) {
    console.error("Edit message error:", error.message);
    res.status(error.message.includes("not found") || error.message.includes("authorized") ? 403 : 500).json({ success: false, message: error.message });
  }
};

export const deleteConversation = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const userType = normalizeUserType((req as any).user.role || "student");
    const { otherUserId } = req.params;
    const { otherUserType } = req.query;

    if (!otherUserType) return res.status(400).json({ success: false, message: "Other user type is required" });

    let targetId = String(otherUserId);
    let targetType = normalizeUserType(String(otherUserType));

    if (targetId === "admin" || targetType === "admin") {
      const adminResult = await query("SELECT id FROM master_admins LIMIT 1");
      if (adminResult.length > 0) {
        targetId = adminResult[0].id;
        targetType = "admin";
      }
    }

    await messageModel.deleteConversationForMe(userId, userType, targetId, targetType);

    res.json({ success: true, message: "Conversation deleted for you successfully" });
  } catch (error: any) {
    console.error("Delete conversation error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete conversation" });
  }
};
