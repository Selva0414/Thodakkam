import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { sendMCQScheduleEmail } from '../services/emailService';

async function test() {
  console.log("SMTP HOST:", process.env.EMAIL_HOST);
  console.log("SMTP USER:", process.env.EMAIL_USER);

  try {
    console.log("Sending test MCQ Schedule Email for 'Software Tester' position...");
    await sendMCQScheduleEmail(
      'mukesh1152006@gmail.com',
      'Mukesh A',
      'Zentro Solutions',
      'Automation QA Assessment',
      'Software Tester'
    );
    console.log("MCQ Email with job name sent successfully!");
  } catch (err: any) {
    console.error("MCQ Email failed:", err);
  }
}

test().then(() => process.exit(0));
