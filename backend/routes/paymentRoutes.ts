import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

// Lazy initialization of Razorpay to avoid dotenv hoisting issues
let razorpayInstance: any = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    });
  }
  return razorpayInstance;
};

// POST /api/payment/create-order
router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount, currency = "INR", receipt = `receipt_${Date.now()}` } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: "Invalid amount. Minimum 100 paise." });
    }

    const options = {
      amount, // amount in the smallest currency unit (e.g. paise)
      currency,
      receipt
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);
    
    return res.status(200).json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    const details = error.error ? error.error.description : error.message;
    return res.status(500).json({ success: false, message: `Could not create Razorpay order: ${details}` });
  }
});

// POST /api/payment/verify-signature
router.post("/verify-signature", (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required signature fields." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    
    // Generate signature using HMAC SHA256
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.status(200).json({ success: true, message: "Payment verified successfully." });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature." });
    }
  } catch (error) {
    console.error("Razorpay verify-signature error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during verification." });
  }
});

export default router;
