import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import http from "http";
import dns from "dns";
import Razorpay from "razorpay";

// Resolve DNS lookup order issue on Windows (Node 17+) by preferring IPv4 first
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
import { Server as SocketIO } from "socket.io";
import { query, testConnection, pool } from "./config/database";
import { ensureCoreSchema, ensureMasterAdmin } from "./config/ensureCoreSchema";
import { checkNoShowInterviews } from "./jobs/interviewNoShowChecker";
import { startTrialLockChecker } from "./jobs/trialLockChecker";
import { checkAndSendInterviewReminders } from "./jobs/interviewReminderCron";
import { checkAndSendAssessmentReminders } from "./jobs/assessmentReminderCron";
import dotenv from "dotenv";
import mockDataRouter from "./mock/mockDataRouter";
import { resolveMediaUrl } from "./utils/mediaUrl";

// Resolve .env from the backend/ root no matter where this file runs from
// (handles both `ts-node server.ts` from backend/ and `node dist/server.js`)
(function loadEnv() {
  const fs = require('fs');
  let dir = __dirname;
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) { dotenv.config({ path: candidate }); return; }
    dir = path.dirname(dir);
  }
  dotenv.config(); // fallback: use cwd
})();

if (process.env.ALLOW_INSECURE_TLS === "1" || process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// ── Global error guards — prevent DB flakiness (ECONNRESET, ETIMEDOUT) from crashing ──
process.on("unhandledRejection", (reason: any) => {
  const code = reason?.code || "";
  const msg  = reason?.message || String(reason);
  // These are expected transient DB errors from background jobs — just log them
  if (["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EPIPE", "ENOTFOUND"].includes(code)) {
    console.warn(`[Server] Suppressed transient DB error (${code}): ${msg}`);
  } else {
    console.error("[Server] Unhandled promise rejection:", msg);
  }
});

process.on("uncaughtException", (err: any) => {
  const code = err?.code || "";
  if (["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EPIPE"].includes(code)) {
    console.warn(`[Server] Suppressed uncaught DB exception (${code}): ${err.message}`);
  } else {
    console.error("[Server] Uncaught exception:", err.message, err.stack);
    // Don't exit for non-fatal errors — only exit for truly unrecoverable errors
  }
});


const app = express();
const server = http.createServer(app);

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://thodakkam.com,https://thodakkam.com,http://www.thodakkam.com,https://www.thodakkam.com")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

const io = new SocketIO(server, { 
  cors: { 
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (normalizedOrigin.startsWith("http://192.168.") || normalizedOrigin.startsWith("http://10.") || normalizedOrigin.startsWith("http://172.")) {
        return cb(null, true);
      }
      if (CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(normalizedOrigin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    }, 
    methods: ["GET", "POST"] 
  } 
});
app.set("io", io);

const onlineUsers = new Map<string, { userId: number; userType: string }>();

const normalizeUserType = (userType: any) => String(userType || "").toLowerCase().trim();
const getUserKey = (userId: any, userType: any) => `${userId}_${normalizeUserType(userType)}`;

const updateUserPresence = async (userId: number, userType: string, isOnline: boolean) => {
  const normalizedType = String(userType || "").toLowerCase();
  const tableName = normalizedType === "startup" ? "startups" : normalizedType === "student" ? "students" : null;

  if (!tableName) return;

  try {
    await query(`UPDATE ${tableName} SET is_online = $1, last_seen = NOW() WHERE id = $2`, [Boolean(isOnline), Number(userId)]);
  } catch (err: any) {
    // Only ignore "column does not exist" (42703) errors; surface the rest
    if (err?.code !== "42703") {
      console.error("[Socket] updateUserPresence error:", err.message);
    }
  }
};

io.on("connection", (socket) => {
  socket.on("join_community_feed", () => {
    socket.join("community_feed");
  });

  socket.on("leave_community_feed", () => {
    socket.leave("community_feed");
  });

  socket.on("join_room", async ({ userId, userType }) => {
    const normalizedUserId = isNaN(Number(userId)) ? userId : Number(userId);
    const normalizedUserType = normalizeUserType(userType);
    const room = getUserKey(normalizedUserId as string | number, normalizedUserType);
    socket.join(room);
    onlineUsers.set(socket.id, { userId: normalizedUserId as number, userType: normalizedUserType });

    // Admin users also join a shared broadcast room
    if (normalizedUserType === "admin") {
      socket.join("admin_broadcast");
      console.log(`[Socket] Admin user ${normalizedUserId} joined admin_broadcast room.`);
    }

    try {
      await updateUserPresence(normalizedUserId, normalizedUserType, true);
    } catch (error: any) {
      console.error("[Socket] Failed to persist online status:", error.message);
    }

    const onlinePayload = { userId: normalizedUserId, userType: normalizedUserType };
    io.emit("user_online", onlinePayload);
    io.emit("userOnline", onlinePayload);

    const activeUsers = [...onlineUsers.values()].map((u) => getUserKey(u.userId, u.userType));
    socket.emit("active_users", Array.from(new Set(activeUsers)));
    console.log(`[Socket] User joined room: ${room}`);
  });

  socket.on("typing", ({ receiverId, receiverType, conversationId }) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      const receiverRoom = getUserKey(receiverId, receiverType);
      const payload = { userId: user.userId, userType: user.userType, receiverId: Number(receiverId), receiverType: normalizeUserType(receiverType), conversationId };
      io.to(receiverRoom).emit("typing", payload);
      io.to(receiverRoom).emit("user_typing", { userId: user.userId, userType: user.userType });
    }
  });

  socket.on("stopTyping", ({ receiverId, receiverType, conversationId }) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      const receiverRoom = getUserKey(receiverId, receiverType);
      const payload = { userId: user.userId, userType: user.userType, receiverId: Number(receiverId), receiverType: normalizeUserType(receiverType), conversationId };
      io.to(receiverRoom).emit("stopTyping", payload);
      io.to(receiverRoom).emit("user_stop_typing", { userId: user.userId, userType: user.userType });
    }
  });

  socket.on("stop_typing", ({ receiverId, receiverType, conversationId }) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      const receiverRoom = getUserKey(receiverId, receiverType);
      const payload = { userId: user.userId, userType: user.userType, receiverId: Number(receiverId), receiverType: normalizeUserType(receiverType), conversationId };
      io.to(receiverRoom).emit("stopTyping", payload);
      io.to(receiverRoom).emit("user_stop_typing", { userId: user.userId, userType: user.userType });
    }
  });

  socket.on("disconnect", async () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      const stillOnline = [...onlineUsers.values()].some((u) => u.userId === user.userId && u.userType === user.userType);
      if (!stillOnline) {
        const lastSeen = new Date().toISOString();
        try {
          await updateUserPresence(user.userId, user.userType, false);
        } catch (error: any) {
          console.error("[Socket] Failed to persist offline status:", error.message);
        }
        io.emit("user_offline", { userId: user.userId, userType: user.userType });
        io.emit("userOffline", { userId: user.userId, userType: user.userType, lastSeen });
      }
    }
    console.log("[Socket] User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, "");
    
    // Allow local network IP testing (mobile devices)
    if (normalizedOrigin.startsWith("http://192.168.") || normalizedOrigin.startsWith("http://10.") || normalizedOrigin.startsWith("http://172.")) {
      return cb(null, true);
    }
    
    if (CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(normalizedOrigin)) {
      return cb(null, true);
    }
    
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// gzip/deflate responses (skip pre-compressed assets in /uploads).
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

// JSON/urlencoded body limits: keep small for normal API; multipart routes use multer separately.
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "2mb";
const URLENCODED_BODY_LIMIT = process.env.URLENCODED_BODY_LIMIT || "2mb";
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: URLENCODED_BODY_LIMIT }));

// Lightweight request logger (skipped in production unless explicitly enabled).
const REQUEST_LOG_ENABLED = process.env.REQUEST_LOG === "1" ||
  (process.env.NODE_ENV !== "production" && process.env.REQUEST_LOG !== "0");
if (REQUEST_LOG_ENABLED) {
  app.use((req, _res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });
}

// Cache static uploads aggressively; filenames are content-addressed enough for safe caching.
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: "7d",
  etag: true,
  lastModified: true,
  fallthrough: true,
}));

const USE_MOCK_DATA = String(process.env.USE_MOCK_DATA || "").toLowerCase() === "true";
if (USE_MOCK_DATA) {
  console.log("⚠️  Mock data mode is enabled (USE_MOCK_DATA=true).");
  app.use("/api", mockDataRouter);
}

import adminAuthRoutes from "./routes/auth";
import adminDashboardRoutes from "./routes/dashboard";
import startupsRoutes from "./routes/startups";
import studentsRoutes from "./routes/students";
import analyticsRoutes from "./routes/analytics";
import settingsRoutes from "./routes/settings";
import adminApplicationRoutes from "./routes/adminApplications";
import { protect, protectAdmin, protectStartup, protectStudent, protectAny } from "./middleware/auth";
import { updateProfile } from "./controllers/settingsController";

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", protectAdmin, adminDashboardRoutes);
app.use("/api/admin/startups", protectAdmin, startupsRoutes);
// Startups listing available to authenticated users (e.g. student browsing); per-route guards inside
app.use("/api/startups", startupsRoutes);
app.use("/api/admin/students", protectAdmin, studentsRoutes);
app.use("/api/admin/analytics", protectAdmin, analyticsRoutes);
app.use("/api/admin/settings", protectAdmin, settingsRoutes);
app.use("/api/admin/applications", protectAdmin, adminApplicationRoutes);
app.patch("/api/admin/profile", protectAdmin, updateProfile);

app.get("/api/admin/contact-info", protectAny, async (req: Request, res: Response) => {
  try {
    let result = await pool.query("SELECT id, admin_name, avatar_url FROM master_admins LIMIT 1");
    
    // Auto-seed/create a default master admin if table is empty
    if (!result.rows.length) {
      try {
        const adminName = process.env.MASTER_ADMIN_NAME || 'Master Admin';
        const email = process.env.MASTER_ADMIN_EMAIL || 'admin@startup.local';
        // Pre-computed bcrypt hash for 'Admin@12345'
        const passwordHash = "$2a$10$eEwh4N2pL9JbXf8qHlD.1e1w8tGf2W/2v5gV4k6r6gYtV5f7c3rW.";
        
        await pool.query(
          "INSERT INTO master_admins (admin_name, email, password_hash, is_verified) VALUES ($1, $2, $3, true) ON CONFLICT (email) DO NOTHING",
          [adminName, email, passwordHash]
        );
        
        result = await pool.query("SELECT id, admin_name, avatar_url FROM master_admins LIMIT 1");
      } catch (err: any) {
        console.error("Auto-seeding master admin failed inside endpoint:", err.message);
      }
    }

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "No admin found" });
    }
    const admin = result.rows[0];

    // Retroactively update/map any legacy placeholder 'admin' messages to the actual master admin UUID!
    try {
      await pool.query("UPDATE messages SET receiver_id = $1 WHERE receiver_id = 'admin'", [admin.id]);
      await pool.query("UPDATE messages SET sender_id = $1 WHERE sender_id = 'admin'", [admin.id]);
    } catch (updateErr: any) {
      console.error("Failed to run retroactive admin ID update:", updateErr.message);
    }

    res.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.admin_name,
        avatar: admin.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.admin_name || 'Admin')}&background=7C3AED&color=fff`,
        type: 'admin'
      }
    });
  } catch (error: any) {
    console.error("Get admin contact info error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch admin info" });
  }
});

import studentRoutes from "./routes/studentRoutes";
import jobRoutes from "./routes/jobRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import communityRoutes from "./routes/communityRoutes";
import aiChatRoutes from "./routes/aiChatRoutes";
import resumeAnonymizerRoutes from "./routes/resumeAnonymizerRoutes";
import messageRoutes from "./routes/messageRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import userProfileRoutes from "./routes/userProfileRoutes";
import courseRoutes from "./routes/courseRoutes";
import practiceRoutes from "./routes/practiceRoutes";

// Mock endpoint to generate Razorpay order for Learning Hub frontend testing
app.post("/api/mock-course-order", async (req: Request, res: Response) => {
  try {
    const { amount = 49900 } = req.body;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `course_${Date.now()}`
    });
    return res.json({ success: true, order_id: order.id });
  } catch (error: any) {
    console.error("Mock course order error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.use("/api/students", studentRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/students", notificationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/aichat", aiChatRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/practice", practiceRoutes);

// ── AI Proxy: Job Description Generator (avoid browser CORS) ──────────────────
app.post("/api/ai/generate-job-description", async (req: Request, res: Response) => {
  const { job_title, jobTitle } = req.body || {};
  const title = (job_title || jobTitle || "").trim();
  if (!title) {
    return res.status(400).json({ success: false, message: "job_title is required" });
  }
  try {
    const externalRes = await fetch("https://generate-job-description.onrender.com/generate-job-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_title: title }),
    });
    const text = await externalRes.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!externalRes.ok) {
      return res.status(externalRes.status).json({ success: false, message: "External API error", raw: data });
    }
    // Format the structured response into a readable description
    let description = "";
    if (data.job_summary) description += `${data.job_summary}\n\n`;
    if (Array.isArray(data.responsibilities) && data.responsibilities.length) {
      description += `Responsibilities:\n${data.responsibilities.map((r: string) => `• ${r}`).join("\n")}\n\n`;
    }
    if (Array.isArray(data.required_skills) && data.required_skills.length) {
      description += `Required Skills:\n${data.required_skills.map((s: string) => `• ${s}`).join("\n")}\n\n`;
    }
    if (Array.isArray(data.preferred_qualifications) && data.preferred_qualifications.length) {
      description += `Preferred Qualifications:\n${data.preferred_qualifications.map((q: string) => `• ${q}`).join("\n")}`;
    }
    return res.json({ success: true, description: description.trim(), data });
  } catch (err: any) {
    console.error("[AI Proxy] generate-job-description error:", err.message);
    return res.status(502).json({ success: false, message: "Could not reach AI service", error: err.message });
  }
});

// ── Udyam Proxy: verify MSME Udyam registration number (avoid browser CORS) ──
app.post("/api/verify/udyam", async (req: Request, res: Response) => {
  const { udyam_no } = req.body || {};
  if (!udyam_no || !String(udyam_no).trim()) {
    return res.status(400).json({ success: false, message: "udyam_no is required" });
  }
  try {
    const externalRes = await fetch("https://udyam-2-bonr.onrender.com/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ udyam_no: String(udyam_no).trim() }),
    });
    const data = await externalRes.json() as any;
    return res.json({ success: true, status: data.status, udyam_no: data.udyam_no });
  } catch (err: any) {
    console.error("[Udyam Proxy] error:", err.message);
    return res.status(502).json({ success: false, message: "Could not reach Udyam verification service", error: err.message });
  }
});

// AI services (Resume Anonymizer + MCQ Agent)
app.use("/api/ai", resumeAnonymizerRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/message", messageRoutes);

import userRoutes from "./routes/userRoutes";
app.use("/api/users", userRoutes);
app.use("/api/user", userProfileRoutes);

import postRoutes from "./routes/postRoutes";
app.use("/api/posts", postRoutes);

import startupAuthRoutes from "./routes/authRoutes";
import startupJobRoutes from "./routes/startupJobRoutes";
import interviewRoutes from "./routes/interviewRoutes";
import startupDashboardRoutes from "./routes/dashboardRoutes";
import startupApplicationRoutes from "./routes/startupApplicationRoutes";
import assessmentRoutes from "./routes/assessmentRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import { startupStatusGuard } from "./middleware/auth";

app.use("/api/startup/auth", startupAuthRoutes);
app.use("/api/startup/jobs", protectStartup, startupStatusGuard, startupJobRoutes);
app.use("/api/startup/applications", protectStartup, startupStatusGuard, startupApplicationRoutes);
app.use("/api/startup/interviews", protectStartup, startupStatusGuard, interviewRoutes);

import studentInterviewRoutes from "./routes/studentInterviewRoutes";
app.use("/api/student/interviews", protectStudent, studentInterviewRoutes);
app.use("/api/startup/dashboard", protectStartup, startupStatusGuard, startupDashboardRoutes);
app.use("/api/startup/assessments", protectStartup, startupStatusGuard, assessmentRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/startup/subscription", protectStartup, subscriptionRoutes);

import startupNotificationRoutes from "./routes/startupNotificationRoutes";
import NotificationModel from "./models/notificationModel";
import exportRoutes from "./routes/exportRoutes";
import auditLogRoutes from "./routes/auditLog";
import bulkActionRoutes from "./routes/bulkActions";
import notificationCenterRoutes from "./routes/notificationCenterRoutes";
import { initAuditTable } from "./controllers/auditLogController";
import { initAnnouncementsTable } from "./controllers/notificationCenterController";
app.use("/api/notifications", startupNotificationRoutes);
app.use("/api/admin/export", protectAdmin, exportRoutes);
app.use("/api/admin/audit-logs", protectAdmin, auditLogRoutes);
app.use("/api/admin/bulk", protectAdmin, bulkActionRoutes);
app.use("/api/admin/notification-center", protectAdmin, notificationCenterRoutes);

// Initialize new tables
initAuditTable();
initAnnouncementsTable();

// Global Error Handler to ensure JSON responses for unhandled errors
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Global Error Handler:", err);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Max size is 5MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Handle custom file filter errors from Multer
  if (err.message && (err.message.includes('Only JPEG/PNG') || err.message.includes('Only PDF or Word') || err.message.includes('Unexpected field'))) {
    return res.status(400).json({ message: err.message });
  }

  // Fallback
  res.status(500).json({ 
    message: "Internal Server Error", 
    error: err.message || "Unknown error" 
  });
});

app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({ status: "healthy", database: "connected", timestamp: result.rows[0].current_time });
  } catch (error: any) {
    res.status(503).json({ status: "unhealthy", database: "disconnected", error: error.message });
  }
});

app.get("/api/public/stats", async (req: Request, res: Response) => {
  try {
    const studentsResult = await pool.query("SELECT COUNT(*) FROM students");
    const startupsResult = await pool.query("SELECT COUNT(*) FROM startups");
    res.json({
      students: parseInt(studentsResult.rows[0].count, 10) || 0,
      startups: parseInt(startupsResult.rows[0].count, 10) || 0
    });
  } catch (error: any) {
    console.error("Error fetching public stats:", error.message);
    res.status(500).json({ students: 0, startups: 0 });
  }
});

app.get("/api/public/startups", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, company_name, logo_url FROM startups WHERE status = 'ACTIVE' ORDER BY created_at DESC"
    );
    const resolved = result.rows.map((row: any) => ({
      id: row.id,
      name: row.company_name,
      logo_url: resolveMediaUrl(req, row.logo_url)
    }));
    res.json({ success: true, startups: resolved });
  } catch (error: any) {
    console.error("Error fetching public startups list:", error.message);
    res.status(500).json({ success: false, startups: [] });
  }
});

// Student change-password (authenticated, self-only)
import * as studentController from "./controllers/studentController";
const enforceSelfStudent = (req: Request, res: Response, next: any) => {
  const authId = String((req as any).user?.id || "");
  const paramId = String(req.params.studentId || "");
  if (!authId || authId !== paramId) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
};
app.post("/api/students/:studentId/change-password", protectStudent, enforceSelfStudent, studentController.changeStudentPassword);
app.post("/api/student/:studentId/change-password", protectStudent, enforceSelfStudent, studentController.changeStudentPassword);

async function startServer() {
  if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    console.error("❌ JWT_SECRET is not configured. Refusing to start.");
    process.exit(1);
  }

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      console.error(`   Run this command to free it:  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
      console.error(`   Then restart: npm run dev\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`   📡 Socket.IO real-time messaging: enabled`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);

    // Run no-show checker on startup and every 5 minutes
    checkNoShowInterviews(io);
    setInterval(() => checkNoShowInterviews(io), 5 * 60 * 1000);
    console.log(`   ⏰ Interview no-show checker: running every 5 minutes`);

    checkAndSendInterviewReminders(io);
    checkAndSendAssessmentReminders(io);
    setInterval(() => {
      checkAndSendInterviewReminders(io);
      checkAndSendAssessmentReminders(io);
    }, 1 * 60 * 1000);
    console.log(`   ⏰ Interview reminder cron: running every minute`);

    startTrialLockChecker();
  });

  // Graceful shutdown: stop accepting new requests, drain socket.io, close pg pool.
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[shutdown] received ${signal}, draining...`);
    const force = setTimeout(() => {
      console.error("[shutdown] forced exit after 15s timeout");
      process.exit(1);
    }, 15_000);
    force.unref();

    try { io.close(); } catch (e: any) { console.error("[shutdown] io.close error:", e?.message); }
    server.close(async (err) => {
      if (err) console.error("[shutdown] http close error:", err.message);
      try { await pool.end(); console.log("[shutdown] pg pool drained"); }
      catch (e: any) { console.error("[shutdown] pool.end error:", e?.message); }
      clearTimeout(force);
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  void (async () => {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("⚠️  Server is running without a database connection.");
      return;
    }

    // Ensure core tables + notifications + auth helpers (fresh DBs may have no schema yet)
    try {
      await ensureCoreSchema();
      console.log("✅ Core tables (students, startups, jobs, applications) ensured");

      await ensureMasterAdmin();
      console.log("✅ Master admin seeded successfully");

      await NotificationModel.createTable();
      console.log("✅ Notifications table ready (startup_id column ensured)");

      // Ensure student reset password columns exist
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS reset_password_token TEXT`);
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP`);
      // Ensure profile engagement columns exist on students and startups
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0`);
      await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS post_impressions INTEGER DEFAULT 0`);
      await query(`ALTER TABLE startups ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0`);
      await query(`ALTER TABLE startups ADD COLUMN IF NOT EXISTS post_impressions INTEGER DEFAULT 0`);
      console.log("✅ Student reset password columns ensured");
      console.log("✅ profile_views / post_impressions columns ensured on students & startups");

      // Ensure otp_codes table exists (used by student + startup forgot-password OTP flow)
      await query(`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp_code VARCHAR(10) NOT NULL,
          is_used BOOLEAN DEFAULT false,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("✅ otp_codes table ready");

      // Warm up community schema so the first /community/posts request is fast
      try {
        const { warmUpSchema } = await import("./models/communityModel");
        await warmUpSchema();
        console.log("✅ Community schema warmed up");
      } catch (e2: any) {
        console.error("⚠️  Community schema warm-up skipped:", e2.message);
      }
    } catch (e: any) {
      console.error("⚠️  Database initialization failed:", e.message);
    }
  })().catch((error: any) => {
    console.error("⚠️  Unexpected startup bootstrap failure:", error?.message || error);
  });
}

startServer();



