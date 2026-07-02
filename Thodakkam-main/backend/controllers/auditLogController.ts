import { Request, Response } from "express";
import AuditLogModel from "../models/auditLogModel";

/** Initialize the audit_logs table */
export const initAuditTable = async () => {
  try {
    await AuditLogModel.createTable();
    console.log("✅ admin_audit_logs table ready");
  } catch (err: any) {
    console.error("Failed to create audit_logs table:", err.message);
  }
};

/** GET /api/admin/audit-logs */
export const getAuditLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const action = req.query.action as string | undefined;
    const entity_type = req.query.entity_type as string | undefined;
    const admin_id = req.query.admin_id as string | undefined;
    const search = req.query.search as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const result = await AuditLogModel.list({ page, limit, action, entity_type, admin_id, search, from, to });
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Audit logs error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
};

/** GET /api/admin/audit-logs/stats */
export const getAuditStats = async (_req: Request, res: Response): Promise<any> => {
  try {
    const stats = await AuditLogModel.getStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    console.error("Audit stats error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch audit stats" });
  }
};

/** GET /api/admin/audit-logs/export */
export const exportAuditLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const action = req.query.action as string | undefined;
    const entity_type = req.query.entity_type as string | undefined;

    const data = await AuditLogModel.exportLogs({ from, to, action, entity_type });
    res.json({ success: true, data, count: data.length });
  } catch (err: any) {
    console.error("Export audit logs error:", err.message);
    res.status(500).json({ success: false, message: "Failed to export audit logs" });
  }
};

/**
 * Helper to log an admin action from any controller.
 * Usage: logAdminAction(req, 'APPROVE_STARTUP', 'startup', startup.id, startup.company_name, { oldStatus, newStatus });
 */
export const logAdminAction = async (
  req: Request,
  action: string,
  entity_type: string,
  entity_id?: string,
  entity_name?: string,
  details?: Record<string, any>
) => {
  try {
    const admin = (req as any).admin || (req as any).user;
    const admin_id = admin?.id?.toString() || admin?.adminId?.toString() || "unknown";
    const admin_name = admin?.name || admin?.email || "Admin";
    const ip_address = req.ip || req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "";

    await AuditLogModel.log({
      admin_id,
      admin_name,
      action,
      entity_type,
      entity_id,
      entity_name,
      details,
      ip_address,
    });
  } catch (err: any) {
    // Don't fail the main operation if audit logging fails
    console.error("Audit log write error:", err.message);
  }
};
