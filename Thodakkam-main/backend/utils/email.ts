import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = async (options: { email: string; subject: string; message: string; html?: string }): Promise<void> => {
  const port = Number(process.env.EMAIL_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: port,
    secure: port === 465, // Use SSL for port 465, TLS for others
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"Career Portal" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.email}`);
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export default sendEmail;
