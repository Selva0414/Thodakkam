import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const portRaw = process.env.SMTP_PORT || process.env.EMAIL_PORT;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const passRaw = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  const port = Number.parseInt(String(portRaw || "587"), 10);
  const pass = String(passRaw || "").trim().replace(/\s+/g, "");
  return {
    host,
    port,
    user,
    pass,
    configured: Boolean(host && Number.isInteger(port) && user && pass),
  };
}

// Module-level singleton transporter with built-in connection pool.
// Avoids creating a new transporter (and TCP/TLS handshake) on every email.
let cachedTransporter: any = null;
let cachedTransporterKey = "";

function getTransporter() {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return null;
  }

  // Re-create only if SMTP config actually changed (e.g., env reload in dev).
  const key = `${smtp.host}|${smtp.port}|${smtp.user}`;
  if (cachedTransporter && cachedTransporterKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
  cachedTransporterKey = key;
  return cachedTransporter;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpEmailTemplate(userName: string, otpCode: string, expiryMinutes: number = 10): string {
  const templatePath = path.join(__dirname, "../templates/otp-email.html");

  try {
    let template = fs.readFileSync(templatePath, "utf8");
    template = template.replace(/\{\{user_name\}\}/g, userName || "User");
    template = template.replace(/\{\{otp_code\}\}/g, otpCode);
    template = template.replace(/\{\{expiry_minutes\}\}/g, String(expiryMinutes));
    return template;
  } catch (error) {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:40px 16px;font-family:Arial,sans-serif;background-color:#F3F4F6;">
        <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;">
          <div style="height:5px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);"></div>
          <div style="text-align:center;padding:40px 25px 30px;">
            <div style="width:52px;height:52px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);border-radius:12px;line-height:52px;text-align:center;margin:0 auto 24px;">
              <span style="color:#fff;font-weight:700;font-size:16px;">ED</span>
            </div>
            <h1 style="margin:0 0 8px;font-weight:700;font-size:24px;color:#8033CC;">Verify Your Email</h1>
            <p style="margin:0;font-size:13px;color:#64748B;">Secure access to your account</p>
          </div>
          <div style="padding:0 25px;">
            <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#334155;">Hello <strong>${userName || "User"}</strong>,</p>
            <p style="margin:0;font-size:14px;line-height:22px;color:#334155;">Use the One-Time Password (OTP) below to complete your email verification. This ensures secure access to your account.</p>
          </div>
          <div style="text-align:center;padding:32px 25px 24px;">
            <div style="display:inline-block;padding:16px 26px;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:12px;">
              <span style="font-weight:700;font-size:32px;letter-spacing:8px;color:#8033CC;">${otpCode}</span>
            </div>
            <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;">Valid for ${expiryMinutes} minutes</p>
          </div>
          <div style="padding:0 25px 32px;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:20px 16px;">
              <p style="margin:0 0 12px;font-size:13px;color:#475569;">🔒 Never share your OTP with anyone.</p>
              <p style="margin:0;font-size:13px;color:#475569;">⚠️ If you didn't request this, you can ignore this email.</p>
            </div>
          </div>
          <div style="text-align:center;padding:32px 20px 40px;border-top:1px solid #E2E8F0;">
            <p style="margin:0 0 12px;font-weight:700;font-size:12px;color:#94A3B8;">Echo Digital Works</p>
            <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">Startup • Student • Admin Platform</p>
            <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">shabaries@gmail.com</p>
            <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 Echo Digital Works. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export async function sendOtpEmail(toEmail: string, otpCode: string, userName: string, expiryMinutes: number = 10): Promise<void> {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    console.warn(`[DEV_MODE] SMTP is not configured. OTP for ${toEmail} is: ${otpCode}`);
    return;
  }
  const transporter = getTransporter();
  const mailOptions = {
    from: `"Echo Digital Works" <${smtp.user}>`,
    to: toEmail,
    subject: "Verify Your Email - OTP Code",
    html: getOtpEmailTemplate(userName, otpCode, expiryMinutes),
  };
  try {
    if (transporter) {
      await transporter.sendMail(mailOptions);
    }
  } catch (error: any) {
    console.warn(`[DEV_MODE] OTP email delivery failed for ${toEmail}: ${error.message}`);
    console.warn(`[DEV_MODE] Use this OTP for testing: ${otpCode}`);
  }
}

function getApprovalEmailTemplate(founderName: string, companyName: string, status: string, reason?: string): string {
  const statusMessages: Record<string, { title: string; message: string; action: string; color: string }> = {
    ACTIVE: {
      title: "🎉 Congratulations! Your Startup is Approved",
      message: "Your startup has been successfully approved by our admin team. You can now access all features of the platform.",
      action: "Login to Your Dashboard",
      color: "#059669"
    },
    REJECTED: {
      title: "❌ Application Update",
      message: "Unfortunately, your startup application has been rejected. Please contact our support team for more information.",
      action: "Contact Support",
      color: "#DC2626"
    },
    SUSPENDED: {
      title: "⚠️ Account Suspended",
      message: "Your startup account has been suspended. Please contact our support team to resolve this issue.",
      action: "Contact Support",
      color: "#D97706"
    }
  };

  const statusInfo = statusMessages[status] || statusMessages.REJECTED;

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:40px 16px;font-family:Arial,sans-serif;background-color:#F3F4F6;">
      <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;">
        <div style="height:5px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);"></div>
        <div style="text-align:center;padding:40px 25px 30px;">
          <div style="width:52px;height:52px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);border-radius:12px;line-height:52px;text-align:center;margin:0 auto 24px;">
            <span style="color:#fff;font-weight:700;font-size:16px;">ED</span>
          </div>
          <h1 style="margin:0 0 8px;font-weight:700;font-size:20px;color:${statusInfo.color};">${statusInfo.title}</h1>
          <p style="margin:0;font-size:13px;color:#64748B;">Echo Digital Works Platform</p>
        </div>
        <div style="padding:0 25px 32px;">
          <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#334155;">Hello <strong>${founderName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#334155;">${statusInfo.message}</p>
          ${reason ? `<p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#334155;"><strong>Reason:</strong> ${reason}</p>` : ''}
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#334155;">Company: ${companyName}</p>
          <p style="margin:0 0 20px;font-size:14px;font-weight:600;color:#334155;">Status: ${status}</p>
          ${status === 'ACTIVE' ? `
            <div style="text-align:center;padding:20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/startup/login"
                 style="display:inline-block;background:${statusInfo.color};color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">
                ${statusInfo.action}
              </a>
            </div>
          ` : ''}
        </div>
        <div style="text-align:center;padding:32px 20px 40px;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 12px;font-weight:700;font-size:12px;color:#94A3B8;">Echo Digital Works</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">Startup • Student • Admin Platform</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">shabaries@gmail.com</p>
          <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 Echo Digital Works. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendApprovalEmail(toEmail: string, founderName: string, companyName: string, status: string, reason?: string): Promise<void> {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    console.warn(`[DEV_MODE] SMTP is not configured. Approval email for ${toEmail} - Status: ${status}`);
    return;
  }

  const transporter = getTransporter();
  const statusSubjects: Record<string, string> = {
    ACTIVE: "🎉 Your Startup Has Been Approved!",
    REJECTED: "Application Status Update",
    SUSPENDED: "Account Status Update"
  };

  const mailOptions = {
    from: `"Echo Digital Works" <${smtp.user}>`,
    to: toEmail,
    subject: statusSubjects[status] || "Application Status Update",
    html: getApprovalEmailTemplate(founderName, companyName, status, reason),
  };

  try {
    if (transporter) {
      await transporter.sendMail(mailOptions);
    }
  } catch (error: any) {
    console.warn(`[DEV_MODE] Approval email delivery failed for ${toEmail}: ${error.message}`);
  }
}

function getStudentStatusEmailTemplate(studentName: string, status: string): string {
  const statusMessages: Record<string, { title: string; message: string; action: string; color: string }> = {
    Active: {
      title: "🎉 Account Activated",
      message: "Your student account has been activated. You can now access all features of the platform.",
      action: "Login to Your Dashboard",
      color: "#059669"
    },
    Suspended: {
      title: "⚠️ Account Suspended",
      message: "Your student account has been suspended. Please contact the admin team for more information.",
      action: "Contact Support",
      color: "#D97706"
    },
    Inactive: {
      title: "❌ Account Deactivated",
      message: "Your student account has been deactivated. Please contact support if you believe this is a mistake.",
      action: "Contact Support",
      color: "#DC2626"
    }
  };

  const statusInfo = statusMessages[status] || statusMessages.Inactive;

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:40px 16px;font-family:Arial,sans-serif;background-color:#F3F4F6;">
      <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;">
        <div style="height:5px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);"></div>
        <div style="text-align:center;padding:40px 25px 30px;">
          <div style="width:52px;height:52px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);border-radius:12px;line-height:52px;text-align:center;margin:0 auto 24px;">
            <span style="color:#fff;font-weight:700;font-size:16px;">ED</span>
          </div>
          <h1 style="margin:0 0 8px;font-weight:700;font-size:20px;color:${statusInfo.color};">${statusInfo.title}</h1>
          <p style="margin:0;font-size:13px;color:#64748B;">Echo Digital Works Platform</p>
        </div>
        <div style="padding:0 25px 32px;">
          <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#334155;">Hello <strong>${studentName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#334155;">${statusInfo.message}</p>
          <p style="margin:0 0 20px;font-size:14px;font-weight:600;color:#334155;">Account Status: ${status}</p>
          ${status === 'Active' ? `
            <div style="text-align:center;padding:20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/login"
                 style="display:inline-block;background:${statusInfo.color};color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">
                ${statusInfo.action}
              </a>
            </div>
          ` : ''}
        </div>
        <div style="text-align:center;padding:32px 20px 40px;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 12px;font-weight:700;font-size:12px;color:#94A3B8;">Echo Digital Works</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">Startup • Student • Admin Platform</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">shabaries@gmail.com</p>
          <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 Echo Digital Works. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendStudentStatusEmail(toEmail: string, studentName: string, status: string): Promise<void> {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    console.warn(`[DEV_MODE] SMTP is not configured. Student status email for ${toEmail} - Status: ${status}`);
    return;
  }

  const transporter = getTransporter();
  const statusSubjects: Record<string, string> = {
    Active: "🎉 Your Account Has Been Activated!",
    Suspended: "⚠️ Account Status Update",
    Inactive: "Account Status Update"
  };

  const mailOptions = {
    from: `"Echo Digital Works" <${smtp.user}>`,
    to: toEmail,
    subject: statusSubjects[status] || "Account Status Update",
    html: getStudentStatusEmailTemplate(studentName, status),
  };

  if (transporter) {
    await transporter.sendMail(mailOptions);
  }
}

function getMCQScheduleEmailTemplate(studentName: string, companyName: string, assessmentTitle: string, jobName?: string): string {
  const forJob = jobName ? ` for the position of <strong>${jobName}</strong>` : '';
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:40px 16px;font-family:Arial,sans-serif;background-color:#F3F4F6;">
      <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;">
        <div style="height:5px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);"></div>
        <div style="text-align:center;padding:40px 25px 30px;">
          <div style="width:52px;height:52px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);border-radius:12px;line-height:52px;text-align:center;margin:0 auto 24px;">
            <span style="color:#fff;font-weight:700;font-size:16px;">ED</span>
          </div>
          <h1 style="margin:0 0 8px;font-weight:700;font-size:20px;color:#8033CC;">📝 Assessment Assigned</h1>
          <p style="margin:0;font-size:13px;color:#64748B;">Echo Digital Works Platform</p>
        </div>
        <div style="padding:0 25px 32px;">
          <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#334155;">Hello <strong>${studentName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#334155;">
            <strong>${companyName}</strong> has assigned you an assessment/MCQ round: <strong>"${assessmentTitle}"</strong>${forJob}.
          </p>
          <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#334155;">
            Please log in to your student portal and complete this round under the scheduled assessments section.
          </p>
          <div style="text-align:center;padding:20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/login"
               style="display:inline-block;background:#8033CC;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">
              View Assessment Dashboard
            </a>
          </div>
        </div>
        <div style="text-align:center;padding:32px 20px 40px;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 12px;font-weight:700;font-size:12px;color:#94A3B8;">Echo Digital Works</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">Startup • Student • Admin Platform</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">shabaries@gmail.com</p>
          <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 Echo Digital Works. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getInterviewScheduleEmailTemplate(studentName: string, companyName: string, roleTitle: string, date: string, time: string, meetLink?: string): string {
  const dateFormatted = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const timeInfo = time ? ` at ${time}` : '';
  const dateTimeStr = `${dateFormatted}${timeInfo}`;
  const meetLinkHtml = meetLink ? '<p style="margin:0;font-size:14px;color:#334155;"><strong>Meeting Link:</strong> <a href="' + meetLink + '" target="_blank" style="color:#8033CC;word-break:break-all;">' + meetLink + '</a></p>' : '';

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:40px 16px;font-family:Arial,sans-serif;background-color:#F3F4F6;">
      <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;">
        <div style="height:5px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);"></div>
        <div style="text-align:center;padding:40px 25px 30px;">
          <div style="width:52px;height:52px;background:linear-gradient(180deg,#8033CC 0%,#401A66 100%);border-radius:12px;line-height:52px;text-align:center;margin:0 auto 24px;">
            <span style="color:#fff;font-weight:700;font-size:16px;">ED</span>
          </div>
          <h1 style="margin:0 0 8px;font-weight:700;font-size:20px;color:#8033CC;">📅 Interview Scheduled</h1>
          <p style="margin:0;font-size:13px;color:#64748B;">Echo Digital Works Platform</p>
        </div>
        <div style="padding:0 25px 32px;">
          <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#334155;">Hello <strong>${studentName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#334155;">
            An interview has been scheduled for you by <strong>${companyName}</strong> for the position of <strong>${roleTitle}</strong>.
          </p>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Date & Time:</strong> ${dateTimeStr}</p>
            ${meetLinkHtml}
          </div>
          <div style="text-align:center;padding:10px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/login"
               style="display:inline-block;background:#8033CC;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">
              View in Dashboard
            </a>
          </div>
        </div>
        <div style="text-align:center;padding:32px 20px 40px;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 12px;font-weight:700;font-size:12px;color:#94A3B8;">Echo Digital Works</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">Startup • Student • Admin Platform</p>
          <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">shabaries@gmail.com</p>
          <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 Echo Digital Works. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendMCQScheduleEmail(toEmail: string, studentName: string, companyName: string, assessmentTitle: string, jobName?: string): Promise<void> {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    console.warn(`[DEV_MODE] SMTP is not configured. MCQ/Assessment email for ${toEmail} - Company: ${companyName}, Assessment: ${assessmentTitle}${jobName ? `, Job: ${jobName}` : ''}`);
    return;
  }

  const transporter = getTransporter();
  const mailOptions = {
    from: `"Echo Digital Works" <${smtp.user}>`,
    to: toEmail,
    subject: `📝 Assessment Assigned${jobName ? ` for ${jobName}` : ''}: ${assessmentTitle}`,
    html: getMCQScheduleEmailTemplate(studentName, companyName, assessmentTitle, jobName),
  };

  try {
    if (transporter) {
      await transporter.sendMail(mailOptions);
    }
  } catch (error: any) {
    console.warn(`[DEV_MODE] MCQ/Assessment email delivery failed for ${toEmail}: ${error.message}`);
  }
}

export async function sendInterviewScheduleEmail(toEmail: string, studentName: string, companyName: string, roleTitle: string, date: string, time: string, meetLink?: string): Promise<void> {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    console.warn(`[DEV_MODE] SMTP is not configured. Interview scheduled email for ${toEmail} - Company: ${companyName}, Role: ${roleTitle}, Date: ${date}, Time: ${time}`);
    return;
  }

  const transporter = getTransporter();
  const mailOptions = {
    from: `"Echo Digital Works" <${smtp.user}>`,
    to: toEmail,
    subject: `📅 Interview Scheduled: ${roleTitle}`,
    html: getInterviewScheduleEmailTemplate(studentName, companyName, roleTitle, date, time, meetLink),
  };

  try {
    if (transporter) {
      await transporter.sendMail(mailOptions);
    }
  } catch (error: any) {
    console.warn(`[DEV_MODE] Interview email delivery failed for ${toEmail}: ${error.message}`);
  }
}
