import { sendEmail } from "../utils/email";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  console.log("Testing email sending with config:");
  console.log("User:", process.env.EMAIL_USER);
  console.log("Pass:", process.env.EMAIL_PASS ? "****" : "MISSING");
  
  try {
    await sendEmail({
      email: process.env.EMAIL_USER || "demoproject356@gmail.com",
      subject: "Test Email from Internship Platform",
      message: "This is a test email to verify SMTP configuration."
    });
    console.log("Test execution finished.");
  } catch (error: any) {
    console.error("Test failed:", error.message);
  }
}

test();
