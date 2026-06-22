import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { sendMCQScheduleEmail, sendInterviewScheduleEmail } from '../services/emailService';

async function test() {
  console.log("SMTP HOST:", process.env.EMAIL_HOST);
  console.log("SMTP USER:", process.env.EMAIL_USER);
  console.log("SMTP PASS Length:", process.env.EMAIL_PASS?.length);

  try {
    console.log("Sending test MCQ Schedule Email...");
    await sendMCQScheduleEmail(
      'mukesh1152006@gmail.com',
      'Mukesh A',
      'zentro solution',
      'DESIGNER1 Assessment'
    );
    console.log("MCQ Email sent successfully!");
  } catch (err: any) {
    console.error("MCQ Email failed:", err);
  }

  try {
    console.log("Sending test Interview Schedule Email...");
    await sendInterviewScheduleEmail(
      'mukesh1152006@gmail.com',
      'Mukesh A',
      'zentro solution',
      'DESIGNER1 Interview',
      '2026-06-17',
      '04:06 PM',
      'https://meet.google.com/abc-defg-hij'
    );
    console.log("Interview Email sent successfully!");
  } catch (err: any) {
    console.error("Interview Email failed:", err);
  }
}

test().then(() => process.exit(0));
