import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query, pool } from '../config/database';

const PRICE_PER_STUDENT_PAISE = 79900; // ₹799 in paise
const PAID_ACCESS_DAYS = 10;
const FREE_STUDENT_LIMIT = 3;

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });
}

// GET /api/startup/subscription/status
export const getStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = (req as any).user?.id;
    const rows = await query(
      `SELECT is_locked, plan_type, trial_started_at, plan_expires_at, locked_at,
              (SELECT COUNT(*) FROM applications WHERE startup_id = $1 AND status NOT IN ('rejected','withdrawn')) as hired_students
       FROM startups WHERE id = $1`,
      [startupId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Startup not found' });

    const s = rows[0];
    const now = new Date();
    let daysRemaining: number | null = null;

    if (s.plan_type === 'trial' && s.trial_started_at) {
      const trialEnd = new Date(s.trial_started_at);
      trialEnd.setDate(trialEnd.getDate() + 7);
      daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (s.plan_type === 'paid' && s.plan_expires_at) {
      daysRemaining = Math.max(0, Math.ceil((new Date(s.plan_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return res.json({
      success: true,
      is_locked: s.is_locked,
      plan_type: s.plan_type,
      days_remaining: daysRemaining,
      hired_students: parseInt(s.hired_students) || 0,
      free_limit: FREE_STUDENT_LIMIT,
      trial_started_at: s.trial_started_at,
      plan_expires_at: s.plan_expires_at,
    });
  } catch (err: any) {
    console.error('[Subscription] getStatus error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/startup/subscription/create-order
export const createOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = (req as any).user?.id;
    const { student_count, domain_info } = req.body;

    if (!student_count || student_count < 1) {
      return res.status(400).json({ success: false, message: 'student_count must be at least 1' });
    }

    if (student_count > 10) {
      return res.status(400).json({ success: false, message: 'You can select a maximum of 10 students at a time.' });
    }

    const amountPaise = student_count * PRICE_PER_STUDENT_PAISE;
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `sub_${startupId}_${Date.now()}`,
      notes: {
        startup_id: startupId,
        student_count: String(student_count),
        domain_info: domain_info || '',
      },
    });

    // Store pending payment record
    await query(
      `INSERT INTO subscription_payments (startup_id, razorpay_order_id, amount_paise, student_count, domain_info, access_days, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [startupId, order.id, amountPaise, student_count, domain_info || '', PAID_ACCESS_DAYS]
    );

    return res.json({
      success: true,
      order_id: order.id,
      amount: amountPaise,
      currency: 'INR',
      razorpay_key: process.env.RAZORPAY_KEY_ID || '',
    });
  } catch (err: any) {
    console.error('[Subscription] createOrder error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// POST /api/startup/subscription/verify
export const verifyPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = (req as any).user?.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Mark payment as paid
    await query(
      `UPDATE subscription_payments SET status = 'paid', razorpay_payment_id = $1
       WHERE razorpay_order_id = $2`,
      [razorpay_payment_id, razorpay_order_id]
    );

    // Unlock startup: set plan_type = 'paid', plan_expires_at = NOW() + 10 days, is_locked = false
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PAID_ACCESS_DAYS);

    await query(
      `UPDATE startups SET is_locked = false, locked_at = NULL, plan_type = 'paid',
              plan_expires_at = $1, status = 'ACTIVE'
       WHERE id = $2`,
      [expiresAt.toISOString(), startupId]
    );

    // Track in audit log
    try {
      await query(
        `INSERT INTO admin_audit_logs (admin_id, admin_name, action, entity_type, entity_id, details)
         VALUES ('SYSTEM', 'System Auto', 'subscription_payment', 'startup', $1, $2)`,
        [startupId, JSON.stringify({ order_id: razorpay_order_id, payment_id: razorpay_payment_id, plan_expires_at: expiresAt })]
      );
    } catch (auditErr) {
      console.error('[Subscription] Audit log error:', auditErr);
    }
    return res.json({
      success: true,
      message: 'Payment successful! Your account is unlocked for 10 days.',
      plan_expires_at: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[Subscription] verifyPayment error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/startup/subscription/jobs-domain — for payment popup domain info
export const getJobsDomain = async (req: Request, res: Response): Promise<any> => {
  try {
    const startupId = (req as any).user?.id;
    const rows = await query(
      `SELECT DISTINCT COALESCE(department, domain) as domain FROM jobs
       WHERE startup_id = $1 AND status = 'active'`,
      [startupId]
    );
    const domains = rows.map((r: any) => r.domain).filter(Boolean);
    return res.json({ success: true, domains });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
