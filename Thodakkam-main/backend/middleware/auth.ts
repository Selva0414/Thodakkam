import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { sql } from "../config/database";
dotenv.config();

const normalizeStartupStatus = (value: any) => {
  const upper = String(value || "PENDING").trim().toUpperCase();
  if (upper === "APPROVED") return "ACTIVE";
  if (upper === "REJECT") return "REJECTED";
  if (upper === "SUSPEND") return "SUSPENDED";
  return upper;
};

const ALLOWED_ROLES = new Set(["admin", "startup", "student"]);

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !String(secret).trim()) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

const extractBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
};

const verifyToken = (req: Request): { id: any; role: string; email?: string; name?: string } | null => {
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, getJwtSecret());
    const role = String(decoded?.role || "").toLowerCase();
    if (!ALLOWED_ROLES.has(role)) return null;
    return { id: decoded.id, role, email: decoded.email, name: decoded.name };
  } catch (error: any) {
    console.error("Auth middleware error:", error.message);
    return null;
  }
};

/**
 * Middleware that enforces a Master Admin JWT.
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
  if (decoded.role !== "admin" && decoded.role !== "startup") {
    return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
  }
  (req as any).adminId = decoded.role === "admin" ? decoded.id : undefined;
  (req as any).user = { id: decoded.id, role: decoded.role, email: decoded.email, name: decoded.name };
  return next();
};

/**
 * Middleware that enforces a Master Admin JWT only (no startups).
 */
export const protectAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
  if (decoded.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden: admin only" });
  }
  (req as any).adminId = decoded.id;
  (req as any).user = { id: decoded.id, role: decoded.role, email: decoded.email, name: decoded.name };
  return next();
};

/**
 * Middleware that enforces a Student JWT.
 */
export const protectStudent = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
  if (decoded.role !== "student") {
    return res.status(403).json({ success: false, message: "Forbidden: student only" });
  }
  (req as any).user = { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role };
  return next();
};

/**
 * Middleware that enforces a Startup JWT.
 */
export const protectStartup = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
  if (decoded.role !== "startup") {
    return res.status(403).json({ success: false, message: "Forbidden: startup only" });
  }
  (req as any).user = { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role };
  return next();
};

/**
 * Middleware that accepts any valid JWT (student, startup, or admin)
 * Sets req.user with id and role. Role MUST be present in the token.
 */
export const protectAny = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
  (req as any).user = {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  };
  return next();
};

/**
 * Middleware to verify startup status is ACTIVE before granting access.
 * Must be used AFTER protect middleware so req.user is set.
 */
export const startupStatusGuard = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authorized" });

    const [startup] = await sql`
      SELECT status, reject_reason, suspend_reason, is_locked,
             plan_type, trial_started_at, plan_expires_at, created_at
      FROM startups WHERE id::text = ${String(userId)}::text
    `;
    if (!startup) return res.status(404).json({ success: false, message: "Startup not found" });

    // Inline trial expiry check — auto-lock if expired, regardless of cron job schedule
    let isLocked = startup.is_locked;
    if (!isLocked) {
      const now = new Date();
      if (startup.plan_type === 'trial') {
        const trialStart = startup.trial_started_at ? new Date(startup.trial_started_at) : new Date(startup.created_at);
        const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (now > trialEnd) {
          isLocked = true;
          // Auto-lock in DB asynchronously (fire and forget)
          sql`UPDATE startups SET is_locked = true, locked_at = NOW() WHERE id::text = ${String(userId)}::text AND is_locked = false`.catch(() => {});
        }
      } else if (startup.plan_type === 'paid' && startup.plan_expires_at) {
        if (now > new Date(startup.plan_expires_at)) {
          isLocked = true;
          sql`UPDATE startups SET is_locked = true, locked_at = NOW() WHERE id::text = ${String(userId)}::text AND is_locked = false`.catch(() => {});
        }
      }
    }

    // Check account lock (trial/paid expiry)
    if (isLocked) {
      return res.status(403).json({
        success: false,
        message: "Your free trial has ended. Please pay to continue hiring.",
        status: "LOCKED",
      });
    }

    const status = normalizeStartupStatus(startup.status);
    if (status !== "ACTIVE") {
      const reason = status === "REJECTED" ? startup.reject_reason
        : status === "SUSPENDED" ? startup.suspend_reason
        : undefined;
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
        status,
        reason: reason || undefined,
      });
    }

    return next();
  } catch (error: any) {
    console.error("Startup status guard error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

