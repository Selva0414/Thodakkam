const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER || 't67757535@gmail.com',
    pass: process.env.EMAIL_PASS || 'hhtm smwp zpnq mgjw'
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"Start Up Portal" <t67757535@gmail.com>',
      to: 't67757535@gmail.com',
      subject: 'Test Verification Code',
      text: 'This is a test email for OTP'
    });
    console.log('Email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('Failed to send email. Error:', error.message);
  }
}

testEmail();
