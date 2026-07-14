import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { query } from "../config/database";

/**
 * POST /api/courses/create-order
 * Body: { courseId, courseName, amount }
 */
export const createCourseOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String((req as any).user?.id);
    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Student session missing." });
    }

    const { courseId, courseName, amount = 49900 } = req.body;
    if (!courseId || !courseName) {
      return res.status(400).json({ success: false, message: "courseId and courseName are required." });
    }

    // Check if already enrolled in this course
    const existing = await query(
      "SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2 AND status = 'ACTIVE'",
      [studentId, courseId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "You are already enrolled in this course." });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: Number(amount),
      currency: "INR",
      receipt: `course_${studentId.substring(0, 8)}_${Date.now()}`
    });

    // Insert or update pending record in course_enrollments (upsert)
    await query(`
      INSERT INTO course_enrollments (student_id, course_id, course_name, amount_paise, razorpay_order_id, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      ON CONFLICT (student_id, course_id)
      DO UPDATE SET 
        course_name = EXCLUDED.course_name,
        amount_paise = EXCLUDED.amount_paise,
        razorpay_order_id = EXCLUDED.razorpay_order_id,
        status = 'PENDING'
    `, [studentId, courseId, courseName, amount, order.id]);

    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      razorpay_key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error("[Course Payment] createCourseOrder error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create order." });
  }
};

/**
 * POST /api/courses/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyCoursePayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String((req as any).user?.id);
    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Student session missing." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required payment details." });
    }

    // Verify payment signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature verification failed." });
    }

    // Update enrollment status to ACTIVE
    const result = await query(`
      UPDATE course_enrollments
      SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'ACTIVE', enrolled_at = NOW()
      WHERE razorpay_order_id = $3
      RETURNING *
    `, [razorpay_payment_id, razorpay_signature, razorpay_order_id]);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Enrollment record not found for this order." });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully. Course access granted!",
      enrollment: result[0]
    });
  } catch (error: any) {
    console.error("[Course Payment] verifyCoursePayment error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to verify payment." });
  }
};

/**
 * GET /api/courses/my-enrollments
 */
export const getMyEnrollments = async (req: Request, res: Response): Promise<any> => {
  try {
    const studentId = String((req as any).user?.id);
    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Student session missing." });
    }

    const enrollments = await query(
      "SELECT course_id, course_name, enrolled_at FROM course_enrollments WHERE student_id = $1 AND status = 'ACTIVE'",
      [studentId]
    );

    return res.json({
      success: true,
      enrollments
    });
  } catch (error: any) {
    console.error("[Course Payment] getMyEnrollments error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch enrollments." });
  }
};
